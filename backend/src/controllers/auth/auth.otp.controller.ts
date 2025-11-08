import { logger } from "@/lib/logger";
import { requestOtpSchema, verifyOtpSchema } from "@/schemas/otp.schema";
import { generateAndSendOtp, verifyEmailOtp, verifyOtp } from "@/services/otp.service";
import { sendError } from "@/utils/errorResponse";
import { FastifyReply, FastifyRequest } from "fastify";

export const requestOtpHandler = async (req: FastifyRequest, reply: FastifyReply) => {
    const body = requestOtpSchema.safeParse(req.body);
    if (!body.success) {
        return sendError(reply, 400, "Validation error", body.error.issues);
    }
    try {
        const { phone, email } = body.data;
        if (!phone && !email) return sendError(reply, 400, "Email or Phone is required to send otp.");

        const { channel, status } = await generateAndSendOtp(phone, email);
        if (status === "pending") return reply.code(200).send({ message: "OTP sent successfully", channel });
        else return sendError(reply, 500, "Failed to send OTP");
    } catch (error) {
        logger.error(error, "Request OTP error")
        return sendError(reply, 500, "Request OTP failed", error)
    }
}

export const verifyOtpHandler = async (req: FastifyRequest, reply: FastifyReply) => {
    const body = verifyOtpSchema.safeParse(req.body);
    if (!body.success) {
        return sendError(reply, 400, "Validation error", body.error.issues);
    }
    try {
        const { phone, email, otp } = body.data;
        if (!phone && !email) return sendError(reply, 400, "Email or Phone is required to verify otp.");

        const results = await Promise.allSettled([
            phone ? verifyOtp(otp, phone) : null,
            email ? verifyEmailOtp(otp, email) : null
        ]);

        const phoneResult = results[0].status === 'fulfilled' && results[0].value ? results[0].value : null;
        const emailResult = results[1].status === 'fulfilled' && results[1].value ? results[1].value : null;

        const response: any = {};

        if (phoneResult) {
            response.phone = {
                success: phoneResult.success,
                message: phoneResult.message
            };
        }

        if (emailResult) {
            response.email = {
                success: emailResult.success,
                message: emailResult.message
            };
        }

        const anySuccess = (phoneResult?.success || emailResult?.success);

        if (anySuccess) {
            return reply.code(200).send({
                message: "OTP verification completed",
                results: response
            });
        } else {
            return sendError(reply, 400, "Failed to verify OTP", response);
        }
    } catch (error) {
        logger.error(error, "Verify OTP error")
        return sendError(reply, 500, "Verify OTP failed", error)
    }
}