import { fetchUserPayments, fetchUserPaymentsSummary, fetchRecentTransactions, fetchActiveSubscription, fetchPendingOrders, fetchUpcomingBookings, fetchAllPayments } from "@/controllers/payment.controller"
import { cancelPayment, createOrder, verifyPayment } from "@/controllers/paymentgateway.controller"
import { requireRole } from "@/middleware/requireRole"
import { FastifyInstance } from "fastify"

export default async function paymentRoutes(fastify: FastifyInstance) {
    // Payment Gateway Routes
    fastify.post("/order", { preHandler: requireRole(['USER']), handler: createOrder })
    fastify.post("/verify", { preHandler: requireRole(['USER']), handler: verifyPayment })
    fastify.post("/cancel", { preHandler: requireRole(['USER']), handler: cancelPayment })

    // User Payment Routes
    fastify.get("/user/payments", { preHandler: requireRole(['USER']) }, fetchUserPayments)

    fastify.get("/user/dashboard/payments/summary", { preHandler: requireRole(['USER']) }, fetchUserPaymentsSummary)

    fastify.get("/user/dashboard/payments/recent", { preHandler: requireRole(['USER']) }, fetchRecentTransactions)

    fastify.get("/user/dashboard/subscription", { preHandler: requireRole(['USER']) }, fetchActiveSubscription)

    fastify.get("/user/dashboard/orders/pending", { preHandler: requireRole(['USER']) }, fetchPendingOrders)

    fastify.get("/user/dashboard/bookings/upcoming", { preHandler: requireRole(['USER']) }, fetchUpcomingBookings)

    fastify.get("/admin/payments", { preHandler: requireRole(['ADMIN', 'SUPER_ADMIN']) }, fetchAllPayments)
}
