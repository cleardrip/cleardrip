import { FastifyReply, FastifyRequest } from "fastify"
import { logger } from "@/lib/logger"
import { forgotPasswordSchema, resetPasswordSchema, signinSchema, signupSchema, updatePasswordSchema, updateUserSchema, verifyResetTokenSchema } from "@/schemas/auth.schema"
import { createUser, findAndUpdateUser, findUserByEmailOrPhone, updateUserFCMToken, updateUserPassword } from "@/services/user.service";
import { removeAuthCookie, setAuthCookie } from "@/utils/cookies";
import { sendError } from "@/utils/errorResponse";
import { generateToken } from "@/utils/jwt";
import { comparePassword } from "@/utils/hash";
import z, { ZodError } from "zod";
import { EmailTemplates } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/sendEmail";
import { generatePasswordResetToken, resetUserPassword, verifyPasswordResetToken } from "@/services/passwordReset.service";
import { sendPasswordResetEmail } from "@/lib/email/sendPasswordResetEmail";
import { generateAndSendOtp, SendEmailOtp } from "@/services/otp.service";
import { formatPhoneNumber } from "@/utils/phone";

export const signupHandler = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
        const body = signupSchema.parse(req.body)
        // Check if user already exists
        const existingUser = await findUserByEmailOrPhone(body.email, body.phone ? body.phone : undefined);
        if (existingUser) {
            return reply.code(400).send({ error: "User already exists with this email or phone number" })
        }
        // Create new user
        const user = await createUser(body);
        const { password, ...safeUser } = user;
        const token = generateToken({ userId: user.id, email: user.email, role: "USER" });
        setAuthCookie(reply, token, "USER")

        if (user.email) {
            // Send welcome email directly
            await sendEmail(
                user.email,
                "Welcome to ClearDrip!",
                `Hello ${user.name}, welcome to ClearDrip!`,
                EmailTemplates.welcomeEmail(user.name, user.email)
            );
            // send OTP email
            try {
                await SendEmailOtp(user.email);
            } catch (ignore) {
                logger.error(ignore, "Failed to send OTP email");
            }
        }
        if (user.phone) {
            try {
                await generateAndSendOtp(user.phone, undefined);
            } catch (ignore) {
                logger.error(ignore, "Failed to send OTP SMS");
            }
        }
        return reply.code(201).send({
            message: "Registration successful",
            user: safeUser
        })
    } catch (error) {
        if (error instanceof ZodError) {
            return sendError(reply, 400, "Validation error", error.issues)
        }
        logger.error(error, "Signup error")
        return sendError(reply, 400, "Signup failed", error)
    }
}

export const signinHandler = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
        const body = signinSchema.parse(req.body)
        const user = await findUserByEmailOrPhone(body.email, undefined, "USER");
        if (!user) {
            return reply.code(404).send({ error: "Invalid credentials" })
        }
        const isPasswordvalid = await comparePassword(body.password, user.password)
        if (!isPasswordvalid) {
            return reply.code(401).send({ error: "Invalid credentials" })
        }
        const token = generateToken({ userId: user.id, email: user.email, role: "USER" })
        setAuthCookie(reply, token, "USER", body.rememberMe)
        const { password, ...safeUser } = user
        return reply.code(200).send({
            message: "Signin successful",
            user: safeUser
        })
    } catch (error) {
        if (error instanceof ZodError) {
            return sendError(reply, 400, "Validation error", error.issues)
        }
        logger.error(error, "Signin error")
        return sendError(reply, 400, "Signin failed", error)
    }
}

export const signoutHandler = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
        removeAuthCookie(reply)
        return reply.code(200).send({ message: "Signout successful" })
    } catch (error) {
        logger.error(error, "Signout error")
        return sendError(reply, 500, "Signout failed", error)
    }
}

export const forgotPasswordHandler = async (
    req: FastifyRequest,
    reply: FastifyReply
) => {
    try {
        const { email } = forgotPasswordSchema.parse(req.body);

        const user = await findUserByEmailOrPhone(email);

        // Always return success for security (prevents email enumeration attacks)
        if (!user || !user.email) {
            logger.warn(`Password reset requested for non-existent email: ${email}`);
            return reply.code(200).send({
                message: "If an account with that email exists, you will receive a password reset link shortly.",
                success: true,
            });
        }

        try {
            // Generate secure reset token
            const { plainToken } = await generatePasswordResetToken(user.id);

            // Send reset email
            await sendPasswordResetEmail(user.email, plainToken, user.name);

            logger.info(`Password reset email sent to ${user.email} for user ${user.id}`);
        } catch (emailError) {
            logger.error(emailError, `Failed to send password reset email to ${user.email}`);
            // Still return success to prevent enumeration
        }

        return reply.code(200).send({
            message: "If an account with that email exists, you will receive a password reset link shortly.",
            success: true,
        });
    } catch (error) {
        logger.error(error, "Forgot password handler error");

        if (error instanceof z.ZodError) {
            return sendError(reply, 400, "Invalid email format", error);
        }

        return sendError(reply, 500, "Failed to process password reset request", error);
    }
};

export const verifyResetTokenHandler = async (
    req: FastifyRequest,
    reply: FastifyReply
) => {
    try {
        const { token } = req.query as { token?: string };

        if (!token) {
            return sendError(reply, 400, "Reset token is required");
        }

        try {
            verifyResetTokenSchema.parse({ token });
        } catch (error) {
            return sendError(reply, 400, "Invalid token format");
        }

        const verification = await verifyPasswordResetToken(token);

        if (!verification.valid) {
            return reply.code(400).send({
                valid: false,
                error: verification.error,
                code: verification.code,
            });
        }

        return reply.code(200).send({
            valid: true,
            message: "Token is valid. You can now reset your password."
        });
    } catch (error) {
        logger.error(error, "Token verification handler error");
        return sendError(reply, 500, "Failed to verify token", error);
    }
};

export const resetPasswordHandler = async (
    req: FastifyRequest,
    reply: FastifyReply
) => {
    try {
        const { token, newPassword } = resetPasswordSchema.parse(req.body);

        try {
            // Reset password (includes token verification)
            const user = await resetUserPassword(token, newPassword);

            logger.info(`Password reset successful for user ${user.id} (${user.email})`);

            return reply.code(200).send({
                success: true,
                message: "Password reset successful! You can now login with your new password.",
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                }
            });
        } catch (error: any) {
            logger.warn(`Password reset failed: ${error.message}`);

            // Return specific error messages
            if (error.message.includes('expired')) {
                return sendError(reply, 400, 'Reset token has expired. Please request a new password reset.', error);
            }

            if (error.message.includes('already been used')) {
                return sendError(reply, 400, 'This reset link has already been used. Please request a new password reset.', error);
            }

            if (error.message.includes('Invalid')) {
                return sendError(reply, 400, 'Invalid reset token. Please request a new password reset.', error);
            }

            throw error;
        }
    } catch (error) {
        logger.error(error, "Reset password handler error");

        if (error instanceof ZodError) {
            const errorMessage = error.issues[0]?.message || "Invalid input";
            return sendError(reply, 400, errorMessage, error);
        }

        return sendError(reply, 500, "Failed to reset password", error);
    }
};

export const updateProfileHandler = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
        const user = req.user
        if (!user) {
            return reply.code(401).send({ error: "Unauthorized" })
        }
        const body = updateUserSchema.safeParse(req.body)
        if (!body.success) {
            return sendError(reply, 400, "Validation error", body.error.issues)
        }
        // email can not be updated
        if (body.data.email) {
            // remove email from data to be updated
            delete body.data.email
        }
        // phone should be unique
        if (body.data.phone) {
            const existingUser = await findUserByEmailOrPhone(undefined, formatPhoneNumber(body.data.phone))
            if (existingUser && existingUser.id !== user.userId) {
                return sendError(reply, 400, "Phone number is already in use")
            }
        }

        // Update user profile logic
        const updatedUser = await findAndUpdateUser(user.userId, body.data)
        const { password, ...safeUser } = updatedUser
        return reply.code(200).send({
            message: "Profile updated successfully",
            user: safeUser
        })
    } catch (error) {
        logger.error(error, "Update profile error")
        return sendError(reply, 500, "Update profile failed", error)
    }
}

export const updatePassword = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
        const user = req.user
        if (!user) {
            return reply.code(401).send({ error: "Unauthorized" })
        }
        const body = updatePasswordSchema.safeParse(req.body)
        if (!body.success) {
            return sendError(reply, 400, "Validation error", body.error.issues)
        }

        // Update user password logic
        const updatedUser = await updateUserPassword(user.userId, body.data.newPassword)
        const { password, ...safeUser } = updatedUser
        return reply.code(200).send({
            message: "Password updated successfully",
            user: safeUser
        })
    } catch (error) {
        logger.error(error, "Update password error")
        return sendError(reply, 500, "Update password failed", error)
    }
}

export const updateFCMTokenHandler = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
        const user = req.user;
        if (!user) {
            return sendError(reply, 400, "Unauthorised");
        }
        const { fcmToken } = req.body as { fcmToken: string };
        if (!fcmToken) {
            return sendError(reply, 400, "FCM token is required");
        }

        // Update user's FCM token
        const updatedUser = await updateUserFCMToken(user.userId, fcmToken);
        return reply.code(200).send({
            message: "FCM token updated successfully",
            user: updatedUser
        });
    } catch (error) {
        logger.error(error, "\nUpdate FCM token error");
        return sendError(reply, 500, "Update FCM token failed", error);
    }
}