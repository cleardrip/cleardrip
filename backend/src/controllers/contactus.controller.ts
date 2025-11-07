import { FastifyReply, FastifyRequest } from "fastify";
import { logger } from "@/lib/logger";
import { sendError } from "@/utils/errorResponse";
import { createContact, deleteContactService, getAllContacts } from "@/services/contactus.service";

export const getContactUs = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
        const contacts = await getAllContacts();
        return reply.code(200).send(contacts);
    } catch (error) {
        logger.error(error, "Get all contacts error");
        return sendError(reply, 500, "Get all contacts failed", error);
    }
};

export const postContactUs = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
        const contactData = req.body as {
            name: string;
            email: string;
            message: string;
        };
        const newContact = await createContact(contactData);
        return reply.code(201).send(newContact);
    } catch (error: any) {
        logger.error(error, "Post contact us error");
        return sendError(reply, 500, error.message, "An error occurred");
    }
};

export const deleteContact = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
        const { id } = req.params as { id: string };
        if (!id) {
            return sendError(reply, 400, "Contact ID is required", "Missing id parameter");
        }

        const deletedContact = await deleteContactService(id);

        logger.info({ id }, "Contact deleted successfully");

        return reply.code(200).send({
            message: "Contact deleted successfully",
            data: deletedContact,
        });
    } catch (error: any) {
        logger.error(error, "Delete contact error");
        if (error.message.includes("does not exist")) {
            return sendError(reply, 404, "Contact not found", error.message);
        }
        
        if (error.message === "Contact ID is required") {
            return sendError(reply, 400, "Contact ID is required", error.message);
        }

        return sendError(reply, 500, "Delete contact failed", error.message);
    }
};