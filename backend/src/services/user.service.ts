import { prisma } from "../lib/prisma"
import { SignupInput } from "../schemas/auth.schema"
import { hashPassword } from "../utils/hash"
import { generateAndSendOtp } from "./otp.service";

export async function findUserByEmailOrPhone(email?: string, phone?: string, role: string = "USER") {
    if (!email && !phone) {
        throw new Error("Email or Phone required.");
    }
    if (role === 'USER') {
        return prisma.user.findFirst({
            where: {
                OR: [
                    { email: email },
                    { phone: phone }
                ]
            },
            include: {
                address: true
            }
        })
    }
    return prisma.admin.findFirst({
        where: {
            OR: [
                { email: email }
            ]
        }
    })
}

export async function createUser(data: SignupInput) {
    const hashedPassword = await hashPassword(data.password)

    const result = await prisma.$transaction(async (tx) => {
        const address = await tx.address.create({
            data: data.address
        })

        return tx.user.create({
            data: {
                name: data.name,
                email: data.email,
                phone: data.phone,
                password: hashedPassword,
                addressId: address.id,
                isEmailVerified: false,
                isPhoneVerified: false
            },
            include: { address: true }
        })
    })
    generateAndSendOtp(data.phone)
    generateAndSendOtp(undefined, data.email)
    return result
}

export async function findAndUpdateUser(userId: string, data: Partial<SignupInput>) {
    // Exclude password from update, but allow address update
    const { address, password, ...userFields } = data;
    const updateData: any = { ...userFields };

    // Fetch current user to determine if address exists
    const existingUser = await findUserById(userId);

    if (address) {
        if (existingUser?.address) {
            // Update existing address
            updateData.address = {
                update: address,
            };
        } else {
            // Create new address
            updateData.address = {
                create: address,
            };
        }
    }

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        include: { address: true },
    });

    return updatedUser;
}

export async function findUserById(userId: string) {
    return prisma.user.findUnique({
        where: { id: userId },
        include: { address: true }
    })
}

export async function updateUserPassword(userId: string, newPassword: string) {
    const hashedPassword = await hashPassword(newPassword);
    return prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
    });
}

export async function updateUserFCMToken(userId: string, fcmToken: string) {
    return prisma.user.update({
        where: { id: userId },
        data: { fcmToken }
    });
}

export async function getAllUsersId() {
    const users = await prisma.user.findMany({
        select: { id: true }
    });
    return users.map(user => user.id);
}