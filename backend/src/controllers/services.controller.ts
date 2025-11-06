import { FastifyRequest } from "fastify/types/request";
import { FastifyReply } from "fastify/types/reply";
import { cancelSchema, rescheduleSchema, serviceDefinitionSchema, serviceSchema, slotSchema, statusSchema } from "@/schemas/services.schema";
import { addServiceDefinition, addSlot, bookService, cancelService, deleteService, deleteSlot, getAllPublicService, getAllServices, getAllSlots, getServiceById, getServiceSlotsAvailable, getTotalServicesCount, rescheduleService, updateStatus } from "@/services/services.service";
import { parsePagination } from "@/utils/parsePagination";
import { isAdmin } from "@/utils/auth";
import { sendError } from "@/utils/errorResponse";
import { createRazorpayOrder } from "@/lib/createRazorpayOrder";
import cloudinary from "@/utils/cloudinary";
import { prisma } from "@/lib/prisma";

export const BookServiceHandler = async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = req.user?.userId;
    
    if (!userId) {
        return sendError(reply, 401, "Unauthorized", "User ID is required");
    }

    try {
        const parts = req.parts();
        const fields: Record<string, any> = {};
        let fileBuffer: Buffer | null = null;
        let fileInfo: { filename: string; mimetype: string } | null = null;

        // Iterate through all parts ONCE
        for await (const part of parts) {
            if (part.type === 'file') {
                console.log(`Received file: ${part.filename}`);
                
                // Validate file type
                const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
                if (!allowedTypes.includes(part.mimetype)) {
                    return sendError(reply, 400, "Unsupported file type", "Only PDF, JPEG, and PNG files are allowed");
                }

                // Convert stream to buffer
                fileBuffer = await part.toBuffer();

                // Validate file size
                if (fileBuffer.length > 5 * 1024 * 1024) {
                    return sendError(reply, 400, "File size exceeds 5MB limit");
                }

                fileInfo = {
                    filename: part.filename,
                    mimetype: part.mimetype
                };
            } else if (part.type === 'field') {
                // Store all form fields
                fields[part.fieldname] = part.value;
            }
        }

        // Validate required fields
        const parsed = serviceSchema.safeParse(fields);
        if (!parsed.success) {
            return sendError(reply, 400, "Validation failed", parsed.error.issues);
        }

        let serviceData = parsed.data;

        // Handle file upload if present
        if (fileBuffer && fileInfo) {
            console.log("Uploading to Cloudinary...");
            
            const resourceType = fileInfo.mimetype === 'application/pdf' ? 'raw' : 'image';

            const uploadedUrl = await new Promise<string>((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        resource_type: resourceType,
                        folder: 'service_images',
                        public_id: `service_${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
                    },
                    (error, result) => {
                        if (error || !result) return reject(error);
                        resolve(result.secure_url);
                    }
                );
                
                stream.end(fileBuffer);
            });

            console.log(`Image uploaded: ${uploadedUrl}`);
            serviceData = {
                ...serviceData,
                beforeImageUrl: uploadedUrl,
            };
        } else {
            console.log("No file uploaded, proceeding without image...");
        }

        console.log("Service data to be booked:", serviceData);

        // Fetch service details and create Razorpay order
        const serviceDetails = await getServiceById(serviceData.serviceId, false);
        if (!serviceDetails) {
            return sendError(reply, 404, "Service not found", "Invalid service ID");
        }

        if (serviceDetails.price == null) {
            return sendError(reply, 500, "Service price is missing", "Invalid service price");
        }

        const priceNumber: number = typeof serviceDetails.price === "number"
            ? serviceDetails.price
            : (typeof (serviceDetails.price as any)?.toNumber === "function"
                ? (serviceDetails.price as any).toNumber()
                : Number(serviceDetails.price));

        if (!isFinite(priceNumber) || priceNumber <= 0) {
            return sendError(reply, 400, "Service price is invalid", "Cannot book free or negative priced service");
        }

        const razorpayOrder = await createRazorpayOrder(priceNumber);
        const bookedService = await bookService(serviceData, userId, razorpayOrder, priceNumber);

        return reply.code(201).send({
            message: "Service booked successfully",
            key: process.env.RAZORPAY_KEY_ID,
            service: bookedService,
            razorpayOrder
        });
    } catch (error) {
        console.error("Service booking failed:", error);
        return sendError(reply, 500, "Failed to book service", error);
    }
};


export const GetServiceByIdHandler = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const userId = req.user?.userId
    const isAdminUser = isAdmin(req.user?.role);
    if (!id) {
        return sendError(reply, 400, "Service ID is required", "Invalid request");
    }
    try {
        const service = await getServiceById(id, isAdminUser);
        if (!service) {
            return sendError(reply, 404, "Service not found", `No service found with the provided ID: ${id}\nUser ID: ${userId}\nAdmin User: ${isAdminUser}`);
        }
        return reply.send({
            message: "Service retrieved successfully",
            service
        });
    } catch (error) {
        console.error("Failed to retrieve service:", error);
        return sendError(reply, 500, "Failed to retrieve service", error);
    }
}

export const GetServiceSlotsAvailableHandler = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
        const slots = await getServiceSlotsAvailable();
        return reply.send({
            message: "Available slots retrieved successfully",
            slots
        });
    } catch (error) {
        console.error("Failed to retrieve service slots:", error);
        return sendError(reply, 500, "Failed to retrieve service slots", error);
    }
}

export const GetAllSlotsHandler = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
        const slots = await getAllSlots();
        return reply.send({
            message: "All slots retrieved successfully",
            slots
        });
    } catch (error) {
        console.error("Failed to retrieve all slots:", error);
        return sendError(reply, 500, "Failed to retrieve all slots", error);
    }
};

export const GetAllServicesHandler = async (req: FastifyRequest, reply: FastifyReply) => {
    const { take, skip } = parsePagination(req.query);
    const userId = req.user?.userId;
    const isAdminUser = isAdmin(req.user?.role);
    if (!userId) {
        return sendError(reply, 401, "Unauthorized", "User ID is required");
    }
    console.log(`\n\nFetching all services for user: ${userId}\n\n`);
    try {
        let services, totalServices;
        if (isAdminUser) {
            services = await getAllServices(take, skip);
            totalServices = await getTotalServicesCount();
        } else {
            services = await getAllServices(take, skip, userId);
            totalServices = await getTotalServicesCount(userId);
        }
        return reply.send({
            message: services.length > 0 ? "Services retrieved successfully" : "No services found",
            services,
            pagination: {
                take,
                skip,
                total: totalServices,
                hasNext: skip + take < totalServices,
            }
        });
    } catch (error: any) {
        console.error("Failed to retrieve services:", error);
        // return sendError(reply, 500, error.message, "Failed to retrieve services");
        return sendError(reply, 500, "API Error", "API Error");
    }
}

export const getAllPublicServices = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
        const { take, skip } = parsePagination(req.query);
        const services = await getAllPublicService(take, skip);
        return reply.send({
            message: "Public services retrieved successfully",
            services
        });
    } catch (error) {
        console.error("Failed to retrieve public services:", error);
        return sendError(reply, 500, "Failed to retrieve public services", error);
    }
}

export const UpdateStatusHandler = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const parsed = statusSchema.safeParse(req.body);

    const userId = req.user?.userId;
    const isAdminUser = isAdmin(req.user?.role);
    if (!id || !parsed.success) {
        return sendError(reply, 400, "Service ID and status are required", "Invalid request");
    }
    const { status } = parsed.data;
    try {
        const updatedService = await updateStatus(id, status, isAdminUser ? undefined : userId);
        return reply.send({
            message: "Service status updated successfully",
            service: updatedService
        });
    } catch (error) {
        return sendError(reply, 500, "Failed to update service status", error);
    }
}

export const DeleteServiceHandler = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const userId = req.user?.userId;
    const isAdminUser = isAdmin(req.user?.role);
    if (!id) {
        return sendError(reply, 400, "Service ID is required", "Invalid request");
    }
    try {
        const deletedService = await updateStatus(id, "CANCELLED", isAdminUser ? undefined : userId);
        return reply.send({
            message: "Service deleted successfully",
            service: deletedService
        });
    } catch (error) {
        return sendError(reply, 422, "Failed to delete service", error);
    }
}

export const AddServiceHandler = async (req: FastifyRequest, reply: FastifyReply) => {
    const parsed = serviceDefinitionSchema.safeParse(req.body);
    const userId = req.user?.userId;
    const isAdminUser = isAdmin(req.user?.role);
    if (!parsed.success) {
        return sendError(reply, 400, "Invalid service data", "Invalid request");
    }
    const serviceData = parsed.data;
    try {
        if (!userId || !isAdminUser) {
            return sendError(reply, 403, "Forbidden", "You do not have permission to add a service");
        }
        const newService = await addServiceDefinition(serviceData, userId);
        return reply.send({
            message: "Service added successfully",
            service: newService
        });
    } catch (error: any) {
        return sendError(reply, 500, error.message, "Failed to add service");
    }
}

export const AddSlotHandler = async (req: FastifyRequest, reply: FastifyReply) => {
    const parsed = slotSchema.safeParse(req.body);
    const userId = req.user?.userId;
    const isAdminUser = isAdmin(req.user?.role);
    if (!parsed.success) {
        return sendError(reply, 400, "Invalid slot data", "Invalid request");
    }

    const slotData = parsed.data;
    try {
        if (!userId || !isAdminUser) {
            return sendError(reply, 403, "Forbidden", "You do not have permission to add a slot");
        }

        const newSlot = await addSlot(slotData);
        return reply.send({
            message: "Slot added successfully",
            slot: newSlot.inserted
        });
    } catch (error: any) {
        console.log(error);
        return sendError(reply, 500, error.message, "Failed to add slot");
    }
}

export const DeleteSlotHandler = async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = req.user?.userId;
    const isAdminUser = isAdmin(req.user?.role);
    const body = req.body as { slotIds: string | string[] };
    const slotIds = Array.isArray(body.slotIds) ? body.slotIds : [body.slotIds];
    if (!slotIds.length) {
        return sendError(reply, 400, "Slot ID is required", "Invalid request");
    }
    if (!userId || !isAdminUser) {
        return sendError(reply, 403, "Forbidden", "You do not have permission to delete a slot");
    }
    try {
        const { deleted, notDeleted } = await deleteSlot(slotIds);
        return reply.send({
            message: ` ${deleted.length} Slots deleted successfully`,
            deletedSlot: deleted,
            notDeletedSlot: notDeleted
        });
    } catch (error: any) {
        return sendError(reply, 422, error.message || "Failed to delete slot", error);
    }
}

export const RescheduleServiceHandler = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const userId = req.user?.userId;

    if (!userId) {
        return sendError(reply, 401, "Unauthorized", "User ID is required");
    }

    const parsed = rescheduleSchema.safeParse(req.body);

    if (!parsed.success) {
        return sendError(reply, 400, "Validation failed", parsed.error.issues);
    }

    const { slotId } = parsed.data;

    try {
        const rescheduledBooking = await rescheduleService(id, slotId, userId);

        return reply.send({
            message: "Service rescheduled successfully",
            booking: rescheduledBooking
        });
    } catch (error: any) {
        console.error("Failed to reschedule service:", error);
        return sendError(reply, 500, error.message || "Failed to reschedule service", error);
    }
};

export const CancelServiceHandler = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const userId = req.user?.userId;

    if (!userId) {
        return sendError(reply, 401, "Unauthorized", "User ID is required");
    }

    const parsed = cancelSchema.safeParse(req.body);

    if (!parsed.success) {
        return sendError(reply, 400, "Validation failed", parsed.error.issues);
    }

    try {
        const cancelledBooking = await cancelService(id, userId, parsed.data.reason);

        return reply.send({
            message: "Service cancelled successfully",
            booking: cancelledBooking
        });
    } catch (error: any) {
        console.error("Failed to cancel service:", error);
        return sendError(reply, 500, error.message || "Failed to cancel service", error);
    }
};


// Get booking detail
export const AdminGetBookingDetailHandler = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { id } = req.params as { id: string };

    const booking = await prisma.serviceBooking.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            type: true,
            price: true,
            duration: true,
          },
        },
        slot: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
          },
        },
        PaymentOrder: {
          select: {
            id: true,
            razorpayOrderId: true,
            amount: true,
            status: true,
          },
        },
      },
    });

    if (!booking) {
      return sendError(reply, 404, "Booking not found");
    }

    return reply.code(200).send({
        success: true,
        message: "Booking details fetched successfully",
        booking: booking,
    });
  } catch (error) {
    console.error("Error fetching booking details:", error);
    return sendError(reply, 500, "Failed to fetch booking details", error);
  }
};

// Update booking status and after image
export const AdminUpdateBookingHandler = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { id } = req.params as { id: string };
    const adminId = req.user?.userId;

    if (!adminId) {
      return sendError(reply, 401, "Unauthorized");
    }

    const parts = req.parts();
    const fields: Record<string, any> = {};
    let fileBuffer: Buffer | null = null;
    let fileInfo: { filename: string; mimetype: string } | null = null;

    // Iterate through all parts
    for await (const part of parts) {
      if (part.type === "file") {
        // Validate file type
        const allowedTypes = ["image/jpeg", "image/png"];
        if (!allowedTypes.includes(part.mimetype)) {
          return sendError(
            reply,
            400,
            "Unsupported file type",
            "Only JPEG and PNG files are allowed"
          );
        }

        // Convert stream to buffer
        fileBuffer = await part.toBuffer();

        // Validate file size (5MB)
        if (fileBuffer.length > 5 * 1024 * 1024) {
          return sendError(reply, 400, "File size exceeds 5MB limit");
        }

        fileInfo = {
          filename: part.filename,
          mimetype: part.mimetype,
        };
      } else if (part.type === "field") {
        fields[part.fieldname] = part.value;
      }
    }

    const { status } = fields;

    if (!status) {
      return sendError(reply, 400, "Status is required");
    }

    // Fetch current booking
    const booking = await prisma.serviceBooking.findUnique({
      where: { id },
      include: {
        service: true,
      },
    });

    if (!booking) {
      return sendError(reply, 404, "Booking not found");
    }

    let afterImageUrl = booking.afterImageUrl;

    // Upload after image if provided
    if (fileBuffer && fileInfo) {
      console.log("Uploading after image to Cloudinary...");

      afterImageUrl = await new Promise<string>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            resource_type: "image",
            folder: "service_after_images",
            public_id: `service_${id}_after_${Date.now()}_${Math.random()
              .toString(36)
              .substring(2, 15)}`,
          },
          (error, result) => {
            if (error || !result) return reject(error);
            resolve(result.secure_url);
          }
        );

        stream.end(fileBuffer);
      });

      console.log(`After image uploaded: ${afterImageUrl}`);
    }

    // Update booking
    const updatedBooking = await prisma.serviceBooking.update({
      where: { id },
      data: {
        status,
        afterImageUrl: afterImageUrl || undefined,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            type: true,
            price: true,
            duration: true,
          },
        },
        slot: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
          },
        },
        PaymentOrder: {
          select: {
            id: true,
            razorpayOrderId: true,
            amount: true,
            status: true,
          },
        },
      },
    });
    return reply.code(200).send({
        success: true,
        message: "Booking updated successfully",
        booking: updatedBooking,
    });
  } catch (error) {
    console.error("Error updating booking:", error);
    return reply.code(400).send({
        success: false,
        message: "Status is required",
        error: null,
    });
  }
};
