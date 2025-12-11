import sendEmail from './sendEmail';
import { EmailTemplates } from './templates';

export const sendPasswordResetEmail = async (
    email: string,
    resetToken: string,
    userName: string
) => {
    // Rename the url before going to production
    const resetUrl = `http://localhost:3000/user/reset-password?token=${resetToken}`;

    const subject = 'Password Reset Request - ClearDrip';

    const message = `Hi ${userName},

You recently requested to reset your password for your ClearDrip account. Click the link below to reset your password:

${resetUrl}

This link will expire in 30 minutes.

If you didn't request this password reset, please ignore this email or contact support if you have concerns.

Best regards,
ClearDrip Team`;

    const html = EmailTemplates.passwordResetEmail(resetUrl, userName);

    return await sendEmail(email, subject, message, html);
};
