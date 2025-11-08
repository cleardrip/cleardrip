// Service to send notifications via WhatsApp
import { prisma } from "@/lib/prisma";
// import { sendWhatsAppMessage } from "@/utils/whatsappUtils";
import { logger } from "@/lib/logger";
import { sendWhatsAppMessage } from "@/utils/sendWhatsAppNotification";

export async function sendWhatsAppNotification(userId: string, message: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
        throw new Error("User not found");
    }

    if (!user.whatsappNumber) {
        throw new Error("WhatsApp number not found for the user");
    }

    try {
        await sendWhatsAppMessage({
            to: user.whatsappNumber,
            message,
        });
    } catch (error) {
        logger.error(`Failed to send WhatsApp notification to user ${userId}: ${(error as Error).message}`);
        throw error;
    }
}