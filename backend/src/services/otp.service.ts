import { prisma } from "@/lib/prisma";
import { encryptOtp, compareOtp } from "@/utils/auth";
import { findUserByEmailOrPhone } from "./user.service";
import { emailQueue, emailQueueName } from "@/queues/email.queue";

import { twilioClient } from "@/lib/twilio";
import { logger } from "@/lib/logger";

export const generateAndSendOtp = async (phone?: string, email?: string): Promise<{ status: string, channel: string }> => {
    if (!phone && !email) {
        throw new Error("Either phone or email must be provided");
    }
    console.log("\n\nGenerate and Send OTP called with", { phone, email }, "\n\n");

    if (phone) {
        try {
            const verification = await twilioClient.verify.v2
                .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
                .verifications.create({
                    to: phone.startsWith("+") ? phone : `+91${phone}`,
                    channel: "sms",
                });

            return { status: verification.status, channel: "phone" };
        } catch (error: any) {
            logger.error("Phone OTP generation error", { phone, error: error.message, code: error.code });

            // Handle specific Twilio errors
            if (error.code === 60212 || error.status === 429) {
                throw new Error("Too many OTP requests. Please try again later");
            }
            if (error.code === 60200) {
                throw new Error("Maximum OTP send attempts reached. Please try again later");
            }
            if (error.code === 21211) {
                throw new Error("Invalid phone number");
            }

            throw new Error(error.message || "Failed to send OTP via phone");
        }
    }

    if (email) {
        try {
            // Send OTP via Email
            await SendEmailOtp(email);
            return { status: "pending", channel: "email" };
        } catch (error: any) {
            logger.error("Email OTP generation error", { email, error: error.message });
            throw new Error(error.message || "Failed to send OTP via email");
        }
    }

    throw new Error("Either phone or email must be provided");
};

export const SendEmailOtp = async (email: string) => {
    if (!email) {
        throw new Error("Email must be provided");
    }
    const user = await findUserByEmailOrPhone(email);
    if (!user) {
        throw new Error("User not found");
    }
    // Will use better later
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP

    // TODO: Send OTP via SMS/Email
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
            email: email,
            user: { connect: { id: user.id } }

        }
    });

    return { status: "pending", channel: "email" };
};

export const verifyOtp = async (otp: string, phone?: string): Promise<{ success: boolean, message: string }> => {
    if (!otp || !phone) {
        return { success: false, message: "OTP and phone number are required" };
    }

    try {
        const user = await findUserByEmailOrPhone(phone);
        if (!user) {
            logger.warn("User not found for phone OTP verification", phone);
            return { success: false, message: "User not found" };
        }

        // remove white spaces and special characters from phone number
        // phone = phone.replace(/\s+/g, '').replace(/[^+\d]/g, '');

        const verification_check = await twilioClient.verify.v2
            .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
            .verificationChecks.create({
                to: (phone.startsWith("+") ? phone : `+91${phone}`),
                code: otp,
            });

        if (verification_check.status === "approved") {
            // OTP is verified, update the user
            await prisma.user.update({
                where: { phone: phone },
                data: { isPhoneVerified: true }
            });
            logger.info("Phone OTP verified successfully for", phone);
            return { success: true, message: "Phone OTP verified successfully" };
        } else {
            logger.warn("Invalid or expired phone OTP", { phone, status: verification_check.status });
            return { success: false, message: "Invalid or expired OTP" };
        }
    } catch (error: any) {
        console.error("Phone OTP verification error", { phone, error: error.message });
        logger.error("Phone OTP verification error", { phone, error: error.message });

        // Handle specific Twilio errors
        if (error.code === 20404) {
            return { success: false, message: "OTP verification session not found or expired" };
        }
        if (error.code === 60200) {
            return { success: false, message: "Maximum OTP verification attempts reached" };
        }

        return { success: false, message: error.message || "Phone OTP verification failed" };
    }
}


export const verifyEmailOtp = async (otp: string, email: string) => {
    if (!otp || !email) {
        return { success: false, message: "OTP and email are required" };
    }

    try {
        const user = await findUserByEmailOrPhone(email);
        if (!user) {
            logger.warn("User not found for email OTP verification", email);
            return { success: false, message: "User not found" };
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
            logger.warn("No valid OTP session found for email", email);
            return { success: false, message: "OTP session not found or expired. Please request a new OTP" };
        }

        const isMatch = await compareOtp(otp, session.otpCode);

        if (!isMatch) {
            logger.warn("Incorrect OTP provided for email", email);
            return { success: false, message: "Incorrect OTP. Please try again" };
        }

        await prisma.oTPSession.update({
            where: { id: session.id },
            data: { verified: true }
        });

        // update user's email verified status
        await prisma.user.update({
            where: { email: email, id: user.id },
            data: { isEmailVerified: true }
        });

        logger.info("Email OTP verified successfully for", email);
        return { success: true, message: "Email OTP verified successfully" };
    } catch (error: any) {
        logger.error("Email OTP verification error", { email, error: error.message });
        return { success: false, message: error.message || "Email OTP verification failed" };
    }
};