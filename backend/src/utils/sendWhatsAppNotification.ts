// utils/sendWhatsAppNotification.ts
import { logger } from "@/lib/logger";
import { Twilio_ACCOUNT_SID, Twilio_AUTH_TOKEN } from "../config/env";
import Twilio from "twilio";

const client = Twilio(Twilio_ACCOUNT_SID, Twilio_AUTH_TOKEN);

interface WhatsAppOptions {
    to: string;
    message: string;
    contentVariables?: Record<string, string>;
    contentSid?: string;
}

export const sendWhatsAppMessage = async ({
    to,
    message,
    contentVariables,
    contentSid,
}: WhatsAppOptions): Promise<string> => {
    try {
        const msg = await client.messages.create({
            from: "whatsapp:+14155238886",
            to: `whatsapp:${to}`,
            contentSid: contentSid || "HX229f5a04fd0510ce1b071852155d3e75",
            contentVariables: contentVariables
                ? JSON.stringify(contentVariables)
                : JSON.stringify({ "1": message }),
        });

        logger.info("WhatsApp Message SID:", msg.sid);
        return msg.sid;
    } catch (error: any) {
        logger.error("Error sending WhatsApp message:", error.message);
        throw new Error(error.message);
    }
};
