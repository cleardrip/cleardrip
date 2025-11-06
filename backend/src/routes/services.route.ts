import { FastifyInstance } from "fastify"
import { requireRole } from "@/middleware/requireRole"
import { AddServiceHandler, AddSlotHandler, AdminGetBookingDetailHandler, AdminUpdateBookingHandler, BookServiceHandler, CancelServiceHandler, DeleteServiceHandler, DeleteSlotHandler, getAllPublicServices, GetAllServicesHandler, GetAllSlotsHandler, GetServiceByIdHandler, GetServiceSlotsAvailableHandler, RescheduleServiceHandler, UpdateStatusHandler } from "@/controllers/services.controller"
import { uploadImage } from "@/controllers/uploadController"
import { AdminDashboardOverviewHandler } from "@/controllers/auth/auth.admin.controller"

export default async function servicesRoutes(fastify: FastifyInstance) {
    fastify.post("/services/book", { preHandler: requireRole(["USER"]) }, BookServiceHandler)
    fastify.get("/services/slots", GetServiceSlotsAvailableHandler)
    fastify.get("/services", { preHandler: requireRole(["USER", "ADMIN", "SUPER_ADMIN"]) }, GetAllServicesHandler)
    fastify.get("/services/:id", { preHandler: requireRole(["USER", "ADMIN", "SUPER_ADMIN"]) }, GetServiceByIdHandler)
    fastify.put("/services/:id/status", { preHandler: requireRole(["ADMIN", "SUPER_ADMIN"]) }, UpdateStatusHandler)
    fastify.delete("/services/:id", { preHandler: requireRole(["USER", "ADMIN", "SUPER_ADMIN"]) }, DeleteServiceHandler)
    fastify.get("/public/services", getAllPublicServices);
    fastify.post("/services/add", { preHandler: requireRole(["ADMIN", "SUPER_ADMIN"]) }, AddServiceHandler);
    fastify.get("/services/slots/all", { preHandler: requireRole(["ADMIN", "SUPER_ADMIN"]) }, GetAllSlotsHandler);
    fastify.post("/services/add/slots", { preHandler: requireRole(["ADMIN", "SUPER_ADMIN"]) }, AddSlotHandler);
    fastify.delete("/services/delete/slots", { preHandler: requireRole(["ADMIN", "SUPER_ADMIN"]) }, DeleteSlotHandler);
    fastify.post("/upload/image", { preHandler: requireRole(["ADMIN", "SUPER_ADMIN"]) }, uploadImage);

    fastify.put("/services/bookings/:id/reschedule", { preHandler: requireRole(["USER"]) }, RescheduleServiceHandler);
    fastify.put("/services/bookings/:id/cancel", { preHandler: requireRole(["USER"]) }, CancelServiceHandler);

    fastify.get("/admin/bookings/:id",{ preHandler: requireRole(["ADMIN", "SUPER_ADMIN"]) },AdminGetBookingDetailHandler);
    fastify.put("/admin/bookings/:id/update",{ preHandler: requireRole(["ADMIN", "SUPER_ADMIN"]) },AdminUpdateBookingHandler);



    fastify.get("/admin/dashboard/stats",  AdminDashboardOverviewHandler)

}