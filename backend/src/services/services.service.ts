import { prisma } from "@/lib/prisma";
import { ServiceDefinitionInput, ServiceInput, SlotInput } from "@/schemas/services.schema";

export const bookService = async (data: ServiceInput, userId: string, razorpayOrder: any, amount: number) => {
    // check if slot is already booked
    const existingBooking = await prisma.serviceBooking.findFirst({
        where: {
            slotId: data.slotId,
        },
    });
    if (existingBooking) {
        throw new Error("Slot is already booked");
    }
    const service = await prisma.serviceBooking.create({
        data: {
            ...data,
            userId,
        },
    });
    // create payment order
    await prisma.paymentOrder.create({
        data: {
            razorpayOrderId: razorpayOrder.id,
            amount: amount,
            status: "PENDING",
            userId,
            purpose: "SERVICE_BOOKING",
            bookingId: service.id,
            subscriptionId: null,
            items: undefined
        }
    })
    return service;
};

export const getServiceSlotsAvailable = async () => {
    const currentDateTime = new Date();
    // Get all future slots including their bookings count
    const slots = await prisma.slot.findMany({
        where: {
            startTime: { gte: currentDateTime },
        },
        include: {
            bookings: true, // include bookings to count them
        },
        orderBy: { startTime: "asc" },
    });

    // Filter slots with less than 1 bookings
    const availableSlots = slots.filter(slot => slot.bookings.length < 1);
    // remove bookings information from available slots
    const availableSlotsWithoutBookings = availableSlots.map(slot => ({
        ...slot,
        bookings: undefined,
    }));
    return availableSlotsWithoutBookings;
};

export const getAllSlots = async () => {
    const slots = await prisma.slot.findMany({
        include: {
            bookings: true,
        },
        orderBy: {
            startTime: "asc"
        }
    });
    // for each slots, count the number of bookings
    const slotsWithBookingCount = slots.map(slot => ({
        ...slot,
        bookingCount: slot.bookings.length,
    }));
    return slotsWithBookingCount;
};

export const getServiceById = async (id: string, isAdmin: boolean) => {
    // if admin user, include all bookings, else include only slot and status
    const Bookings = isAdmin ? {
        include: {
            slot: true
        }
    } : {
        select: {
            slot: true,
            status: true
        }
    };
    const service = await prisma.serviceDefinition.findFirst({
        where: { isActive: true, id },
        include: {
            bookings: Bookings
        },
    });
    return service;
};

// currently not in use (in future soft delete may introduce)
export const deleteService = async (id: string, userId?: string) => {
    const service = await prisma.serviceBooking.findFirst({
        where: {
            id,
            userId,
        },
    });

    if (!service) {
        throw new Error("Service not found or you don't have permission to delete it.");
    }

    await prisma.serviceBooking.delete({
        where: { id },
    });
};

export const getAllServices = async (take: number, skip: number, userId?: string) => {
    // If userId is provided, filter services by userId
    const services = await prisma.serviceBooking.findMany({
        where: userId ? { userId } : {},
        take,
        skip,
        include: {
            user: true,
            slot: true,
            service: true,
            PaymentOrder: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
    
    return services;
};

export const getTotalServicesCount = async (userId?: string) => {
    const count = await prisma.serviceBooking.count({
        where: userId ? { userId } : {},
    });
    return count;
};

enum ServiceStatus {
    PENDING = "PENDING",
    SCHEDULED = "SCHEDULED",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED"
}

export const updateStatus = async (serviceId: string, status: string, userId?: string) => {
    const upperStatus = status.toUpperCase();
    if (!(upperStatus in ServiceStatus)) {
        throw new Error(`Invalid status: ${status}`);
    }

    const service = await prisma.serviceBooking.findFirst({
        where: {
            id: serviceId,
            ...(userId && { userId }),
        },
    });

    if (!service) {
        throw new Error("Service not found or permission denied.");
    }

    const updatedService = await prisma.serviceBooking.update({
        where: { id: serviceId },
        data: { status: upperStatus as ServiceStatus },
    });

    return updatedService;
};

export const getAllPublicService = async (take: number, skip: number) => {
    const services = await prisma.serviceDefinition.findMany({
        where: { isActive: true },
        take,
        skip
    });
    return services;
};

export const addServiceDefinition = async (data: ServiceDefinitionInput, userId: string) => {
    const service = await prisma.serviceDefinition.create({
        data: {
            ...data,
            createdBy: { connect: { id: userId } },
        },
    });
    return service;
};

export const addSlot = async (data: SlotInput) => {
    const now = new Date();

    // make sure we return a flat array of valid slots
    const validSlots: SlotInput = data.filter(
        (slot) =>
            slot.endTime > slot.startTime &&
            slot.startTime > now
    );

    if (validSlots.length === 0) {
        return { inserted: 0 };
    }

    // transaction ensures atomicity
    const result = await prisma.$transaction(async (tx) => {
        const inserted = await tx.slot.createMany({
            data: validSlots,
            skipDuplicates: true,
        });
        return inserted.count;
    });

    return { inserted: result };
};


export const deleteSlot = async (ids: string[]) => {
    // Get all requested slots
    const slots = await prisma.slot.findMany({
        where: { id: { in: ids } },
    });

    if (!slots || slots.length === 0) {
        throw new Error("No slots found");
    }

    // Find slots that are in use
    const bookedSlots = await prisma.serviceBooking.findMany({
        where: { slotId: { in: ids } },
        select: { slotId: true },
    });

    const bookedSlotIds = bookedSlots.map(b => b.slotId);

    // Find slots that can be deleted
    const deletableSlotIds = ids.filter(id => !bookedSlotIds.includes(id));

    if (deletableSlotIds.length > 0) {
        await prisma.slot.deleteMany({
            where: { id: { in: deletableSlotIds } },
        });
    }

    return {
        deleted: deletableSlotIds,
        notDeleted: bookedSlotIds,
    };
};

export const rescheduleService = async (bookingId: string, newSlotId: string, userId: string) => {
    return await prisma.$transaction(async (tx) => {
        // 1. Verify booking exists and belongs to user
        const booking = await tx.serviceBooking.findUnique({
            where: { id: bookingId },
            include: { slot: true, service: true }
        });

        if (!booking) {
            throw new Error("Booking not found");
        }

        if (booking.userId !== userId) {
            throw new Error("Unauthorized: This booking does not belong to you");
        }

        // 2. Check if booking can be rescheduled
        if (booking.status === "COMPLETED" || booking.status === "CANCELLED") {
            throw new Error(`Cannot reschedule a ${booking.status.toLowerCase()} booking`);
        }

        // 3. Verify new slot exists and is available
        const newSlot = await tx.slot.findUnique({
            where: { id: newSlotId },
            include: {
                bookings: {
                    where: {
                        status: {
                            in: ["PENDING", "SCHEDULED", "IN_PROGRESS"]
                        }
                    }
                }
            }
        });

        if (!newSlot) {
            throw new Error("Selected slot not found");
        }

        // Check if slot is in the future
        if (new Date(newSlot.startTime) < new Date()) {
            throw new Error("Cannot reschedule to a past time slot");
        }

        if (newSlot.bookings.length > 0) {
            throw new Error("Selected slot is already booked");
        }

        // 4. Cannot reschedule to the same slot
        if (booking.slotId === newSlotId) {
            throw new Error("Cannot reschedule to the same slot");
        }

        // 5. Update the booking
        const updatedBooking = await tx.serviceBooking.update({
            where: { id: bookingId },
            data: {
                slotId: newSlotId,
                status: "SCHEDULED",
                updatedAt: new Date()
            },
            include: {
                slot: true,
                service: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true
                    }
                }
            }
        });

        return updatedBooking;
    }, {
        timeout: 15000,
        maxWait: 10000
    });
};

export const cancelService = async (bookingId: string, userId: string, reason?: string) => {
    return await prisma.$transaction(async (tx) => {
        // 1. Verify booking exists and belongs to user
        const booking = await tx.serviceBooking.findUnique({
            where: { id: bookingId },
            include: { slot: true, service: true }
        });

        if (!booking) {
            throw new Error("Booking not found");
        }

        if (booking.userId !== userId) {
            throw new Error("Unauthorized: This booking does not belong to you");
        }

        // 2. Check if booking can be cancelled
        if (booking.status === "COMPLETED") {
            throw new Error("Cannot cancel a completed booking");
        }

        if (booking.status === "CANCELLED") {
            throw new Error("Booking is already cancelled");
        }

        // 3. Optional: Check cancellation window
        const slotStartTime = new Date(booking.slot.startTime);
        const now = new Date();
        const hoursUntilService = (slotStartTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        // if you want to enforce 24hrs cancellation policy, uncomment this
        // if (hoursUntilService < 24) {
        //     throw new Error("Cannot cancel booking less than 24 hours before scheduled time");
        // }

        // 4. Update the booking status to CANCELLED
        const cancelledBooking = await tx.serviceBooking.update({
            where: { id: bookingId },
            data: {
                status: "CANCELLED",
                updatedAt: new Date()
            },
            include: {
                slot: true,
                service: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true
                    }
                }
            }
        });

        return cancelledBooking;
    }, {
        timeout: 15000,
        maxWait: 10000
    });
};
