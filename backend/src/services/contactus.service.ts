import { prisma } from "@/lib/prisma";

export const getAllContacts = async () => {
    const contacts = await prisma.contactMessage.findMany();
    return contacts;
};

interface contactData {
    name: string;
    email: string;
    message: string;
}
export const createContact = async (contactData: contactData) => {
    if (!contactData.name || !contactData.email || !contactData.message) {
        throw new Error("Invalid contact data");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactData.email)) {
        throw new Error("Invalid email format");
    }
    // if same email,name and message exist
    const existingContact = await prisma.contactMessage.findFirst({
        where: {
            email: contactData.email,
            name: contactData.name,
            message: contactData.message,
        },
    });
    if (existingContact) {
        throw new Error("Contact message with same email, name and message already exists");
    }
    const newContact = await prisma.contactMessage.create({
        data: contactData,
    });
    return newContact;
};

export const deleteContactService = async (id: string) => {
    if (!id) {
        throw new Error("Contact ID is required");
    }

    const existingContact = await prisma.contactMessage.findUnique({
        where: { id },
    });

    if (!existingContact) {
        throw new Error(`Contact with id ${id} does not exist`);
    }

    const deletedContact = await prisma.contactMessage.delete({
        where: { id },
    });

    return deletedContact;
};