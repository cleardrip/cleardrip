"use server";
import { SMTP_HOST, SMTP_PASSWORD, SMTP_USER, FROM_EMAIL, FROM_NAME } from "../../config/env";
import nodemailer from "nodemailer";
import { logger } from "../logger";

const sendEmail = async (to: string, subject: string, message: string, html: string) => {
    const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: 587,
        secure: false,
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASSWORD,
        },
    });

    try {
        // Verify connection
        await transporter.verify();

        const uniqueId = Date.now();
        const info = await transporter.sendMail({
            from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
            to: to,
            subject: subject,
            text: message,
            html: html || message,
            messageId: uniqueId.toString(),
            headers: {
                "X-Entity-Ref-ID": uniqueId.toString(),
                "X-Entity-Ref-Type": "email",
            },
            date: new Date(),
        });

        logger.info("Email sent successfully:", info.messageId);
        return { 
            message: "Email sent successfully", 
            messageId: info.messageId,
            error: null 
        };

    } catch (error: any) {
        console.error("Error sending email:", error.message);
        return { 
            message: "Email sending failed", 
            error: error.message,
            code: error.code 
        };
    }
};

export default sendEmail;
export { sendEmail };
