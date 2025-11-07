// backend/src/controllers/payment.controller.ts
import { FastifyReply, FastifyRequest } from "fastify";
import {
    getUserPayments,
    getUserPaymentsSummary,
    getRecentTransactions,
    getActiveSubscription,
    getPendingOrders,
    getUpcomingBookings,
    getAllPayments,
} from "@/services/payment.service";
import { sendError } from "@/utils/errorResponse";
import { parsePagination } from "@/utils/parsePagination";

export const fetchUserPayments = async (req: FastifyRequest, res: FastifyReply) => {
    try {
        const userId = (req as any).user?.userId ?? (req as any).user?.id;
        const { take, skip } = parsePagination(req.query);
        const search = ((req.query as any)?.search as string | undefined)?.trim() || undefined;

        if (!userId) {
            return sendError(res, 400, "User ID is required.");
        }

        // getUserPayments now returns { payments, total }
        const { payments, total } = await getUserPayments(userId, take, skip, search);

        // compute page number (simple math, fallback to 1)
        const page = take && take > 0 ? Math.floor((skip || 0) / take) + 1 : 1;

        return res.send({ payments, total, page, limit: take ?? null });
    } catch (error) {
        console.error("Error fetching user payments:", error);
        return sendError(res, 500, "Internal Server Error");
    }
};

export const fetchUserPaymentsSummary = async (req: FastifyRequest, res: FastifyReply) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) return sendError(res, 401, "Unauthorized");
        const summary = await getUserPaymentsSummary(userId);
        return res.send(summary);
    } catch (error) {
        return sendError(res, 500, "Internal Server Error");
    }
};

export const fetchRecentTransactions = async (req: FastifyRequest, res: FastifyReply) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) return sendError(res, 401, "Unauthorized");
        const limit = Number((req.query as any)?.limit) || 5;
        const recent = await getRecentTransactions(userId, limit);
        return res.send({ recent });
    } catch (error) {
        return sendError(res, 500, "Internal Server Error");
    }
};

export const fetchActiveSubscription = async (req: FastifyRequest, res: FastifyReply) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) return sendError(res, 401, "Unauthorized");
        const sub = await getActiveSubscription(userId);
        return res.send({ subscription: sub });
    } catch (error) {
        return sendError(res, 500, "Internal Server Error");
    }
};

export const fetchPendingOrders = async (req: FastifyRequest, res: FastifyReply) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) return sendError(res, 401, "Unauthorized");
        const pending = await getPendingOrders(userId);
        return res.send({ pending });
    } catch (error) {
        return sendError(res, 500, "Internal Server Error");
    }
};

export const fetchUpcomingBookings = async (req: FastifyRequest, res: FastifyReply) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) return sendError(res, 401, "Unauthorized");
        const limit = Number((req.query as any)?.limit) || 5;
        const bookings = await getUpcomingBookings(userId, limit);
        return res.send({ bookings });
    } catch (error) {
        return sendError(res, 500, "Internal Server Error");
    }
};

export const fetchAllPayments = async (req: FastifyRequest, res: FastifyReply) => {
    try {
        const { take, skip } = parsePagination(req.query)
        const search = ((req.query as any)?.search as string | undefined)?.trim() || undefined
        const status = ((req.query as any)?.status as string | undefined)?.trim() || undefined
        const purpose = ((req.query as any)?.purpose as string | undefined)?.trim() || undefined

        const { payments, total } = await getAllPayments(take, skip, search, status, purpose)
        const page = take && take > 0 ? Math.floor((skip || 0) / take) + 1 : 1

        return res.send({ payments, total, page, limit: take ?? null })
    } catch (error) {
        console.error("Error fetching all payments:", error)
        return sendError(res, 500, "Internal Server Error")
    }
}