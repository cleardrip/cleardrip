import { adminCreateSchema, adminSignInSchema } from "@/schemas/auth.schema";
import { createAdminUser, deleteStaffById, fetchAdminDashboardStats, findAdminByEmail, findAllAdmins, getStaffById } from "@/services/admin.service";
import { setAuthCookie } from "@/utils/cookies";
import { sendError } from "@/utils/errorResponse";
import { comparePassword, hashPassword } from "@/utils/hash";
import { generateToken } from "@/utils/jwt";
import { FastifyReply, FastifyRequest } from "fastify";

export const AdminSignInHandler = async (req: FastifyRequest, reply: FastifyReply) => {
    const body = adminSignInSchema.safeParse(req.body);
    if (!body.success) {
        return sendError(reply, 400, "Validation failed", body.error.issues);
    }
    try {
        const admin = await findAdminByEmail(body.data.email);
        if (!admin) {
            return sendError(reply, 404, "Admin not found", "No admin found with the provided email");
        }
        const isPasswordValid = await comparePassword(body.data.password, admin.password);
        if (!isPasswordValid) {
            return sendError(reply, 401, "Invalid password", "The provided password is incorrect");
        }
        const role = admin.role === "STAFF" ? "ADMIN" : "SUPER_ADMIN";
        const token = generateToken({ userId: admin.id, email: admin.email, role });
        setAuthCookie(reply, token, role);
        return reply.code(200).send({ message: "Admin signed in successfully" });
    } catch (error) {
        return sendError(reply, 500, "Failed to sign in admin", error);
    }
}

export const AdminGetAllListHandler = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
        const admins = await findAllAdmins();
        return reply.code(200).send(admins);
    } catch (error) {
        return sendError(reply, 500, "Failed to fetch admin list", error);
    }
}

export const CreateAdminUserHandler = async (req: FastifyRequest, reply: FastifyReply) => {
    const body = adminCreateSchema.safeParse(req.body);
    if (!body.success) {
        return sendError(reply, 400, "Validation failed", body.error.issues);
    }
    try {
        const existingAdmin = await findAdminByEmail(body.data.email);
        if (existingAdmin) {
            return sendError(reply, 409, "Admin already exists", "An admin with this email already exists");
        }
        const hashedPassword = await hashPassword(body.data.password);

        const newAdmin = await createAdminUser({
            email: body.data.email,
            password: hashedPassword,
            name: body.data.name,
        });
        return reply.code(201).send(newAdmin);
    } catch (error) {
        return sendError(reply, 500, "Failed to create admin user", error);
    }
}

export const DeleteStaff = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    try {
        const existingStaff = await getStaffById(id);
        if (!existingStaff) {
            return reply.code(404).send({ error: "Staff not found" });
        }
        const deletedStaff = await deleteStaffById(id);
        return reply.code(200).send({ message: "Staff deleted successfully" });
    }
    catch (error) {
        return sendError(reply, 500, "Delete staff failed", error);
    }
}

export const AdminDashboardOverviewHandler = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
        // Fetch necessary data for the overview
        const stats = await fetchAdminDashboardStats();

        return reply.code(200).send({
            message: "Admin dashboard overview fetched successfully",
            stats
        });
    } catch (error) {
        return sendError(reply, 500, "Failed to fetch admin dashboard overview", error);
    }
}