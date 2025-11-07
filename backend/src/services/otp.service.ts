import { prisma } from "@/lib/prisma";
import { encryptOtp, compareOtp } from "@/utils/auth";
import { findUserByEmailOrPhone } from "./user.service";
import { logger } from "@/lib/logger";
import { emailQueue, emailQueueName } from "@/queues/email.queue";

import { twilioClient } from "@/lib/twilio";

export const generateAndSendOtp = async (phone?: string, email?: string): Promise<{ status: string, channel: string }> => {
    if (!phone && !email) {
        throw new Error("Either phone or email must be provided");
    }

    // const user = await findUserByEmailOrPhone(email, phone);
    // if (!user) {
    //     throw new Error("User not found");
    // }

    if (phone) {
        // ✅ Send OTP via Twilio SMS
        const verification = await twilioClient.verify.v2
            .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
            .verifications.create({
                to: phone.startsWith("+") ? phone : `+91${phone}`,
                channel: "sms",
            });

        return { status: verification.status, channel: "phone" };
    }
    if (email) {
        // ✅ Send OTP via Twilio Email
        const verification = await twilioClient.verify.v2
            .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
            .verifications.create({
                to: email,
                channel: "email",
            });

        return { status: verification.status, channel: "email" };
    }

    throw new Error("Either phone or email must be provided");
};

export const SendEmailOtp = async (email: string) => {
    if (!email) {
        throw new Error("Email must be provided");
    }

    // Will use better later
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP

    // TODO: Send OTP via SMS/Email
    console.log(`OTP for ${email}: ${otp}`);
    emailQueue.add(emailQueueName, {
        to: email,
        subject: "Your OTP Code",
        message: `Your OTP code is ${otp}. It is valid for 5 minutes.`,
        html: `<p>Your OTP code is <strong>${otp}</strong>. It is valid for 5 minutes.</p>`
    });

    const encryptedOtp = await encryptOtp(otp);

    await prisma.oTPSession.create({
        data: {
            otpCode: encryptedOtp,
            channel: "EMAIL",
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
            verified: false,
            email: email
        }
    });

    return true;
};

export const verifyOtp = async (otp: string, phone?: string, email?: string): Promise<{ success: boolean, message: string }> => {
    if (!otp || (!phone && !email)) {
        throw new Error("OTP and either phone or email must be provided");
    }

    // const user = await findUserByEmailOrPhone(email, phone);
    // if (!user) {
    //     throw new Error("User not found");
    // }

    const verification_check = await twilioClient.verify.v2
        .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
        .verificationChecks.create({
            to: phone ? (phone.startsWith("+") ? phone : `+91${phone}`) : email!,
            code: otp,
        });

    if (verification_check.status === "approved") {
        return { success: true, message: "OTP verified successfully" };
    } else {
        throw new Error("Invalid or expired OTP");
    }
};


export const verifyEmailOtp = async (otp: string, email: string) => {
    if (!otp || (!email)) {
        throw new Error("OTP and email must be provided");
    }

    // Fetch the most recent unverified, unexpired OTP session
    const session = await prisma.oTPSession.findFirst({
        where: {
            email: email,
            channel: "EMAIL",
            verified: false,
            expiresAt: {
                gte: new Date()
            }
        },
        orderBy: {
            createdAt: "desc"
        }
    });

    if (!session) {
        throw new Error("Invalid or expired OTP");
    }

    const isMatch = await compareOtp(otp, session.otpCode);

    if (!isMatch) {
        throw new Error("Incorrect OTP");
    }

    await prisma.oTPSession.update({
        where: { id: session.id },
        data: { verified: true }
    });

    return true;
};