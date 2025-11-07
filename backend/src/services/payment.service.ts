import { prisma } from "@/lib/prisma";

export async function getUserPayments(userId: string, take?: number, skip?: number, search?: string) {
    // build dynamic where clause so we only add OR filters when search is provided
    const where: any = { userId };

    if (search && search.trim().length > 0) {
        const q = search.trim();
        const qLower = q.toLowerCase();
        const qUpper = q.toUpperCase();

        // build OR array incrementally so we can add purpose only when valid
        const or: any[] = [
            { razorpayOrderId: { contains: q, mode: "insensitive" } },
            { id: { contains: q } },
            // search product name inside items -> product
            { items: { some: { product: { name: { contains: q, mode: "insensitive" } } } } },
            // search transaction razorpay id
            { transaction: { is: { razorpayPaymentId: { contains: q, mode: "insensitive" } } } },
            // search booking.service.name
            { booking: { is: { service: { name: { contains: q, mode: "insensitive" } } } } },
            // search subscription.plan.name
            { subscription: { is: { plan: { name: { contains: q, mode: "insensitive" } } } } },
        ];

        // Safe handling for enum PaymentPurpose:
        // Only add an equals filter when search clearly corresponds to a known purpose.
        const enumValues = ["SERVICE_BOOKING", "SUBSCRIPTION", "PRODUCT_PURCHASE", "OTHER"];
        const keywordMap: Record<string, string> = {
            service: "SERVICE_BOOKING",
            booking: "SERVICE_BOOKING",
            subscription: "SUBSCRIPTION",
            product: "PRODUCT_PURCHASE",
            purchase: "PRODUCT_PURCHASE",
            other: "OTHER",
        };

        if (enumValues.includes(qUpper)) {
            or.push({ purpose: { equals: qUpper } });
        } else {
            for (const key in keywordMap) {
                if (qLower.includes(key)) {
                    or.push({ purpose: { equals: keywordMap[key] } });
                    break;
                }
            }
        }

        where.OR = or;
    }

    // Fetch rows and total count in a single transaction to keep them consistent
    const [result, totalCount] = await prisma.$transaction([
        prisma.paymentOrder.findMany({
            where,
            take,
            skip,
            orderBy: { createdAt: "desc" },
            include: {
                transaction: true,
                items: {
                    include: {
                        product: true,
                        order: true,
                    },
                },
                booking: {
                    include: {
                        service: true,
                        slot: true,
                    },
                },
                subscription: {
                    include: {
                        plan: true,
                        PaymentOrder: true,
                    },
                },
            },
        }),
        prisma.paymentOrder.count({ where }),
    ]);

    return { payments: result, total: totalCount };
}

export async function getUserPaymentsSummary(userId: string) {
    const totalOrders = await prisma.paymentOrder.count({ where: { userId } });

    const sumResult = await prisma.paymentOrder.aggregate({
        _sum: { amount: true },
        where: { userId, status: "SUCCESS" },
    });

    const totalSpent = sumResult._sum.amount ?? 0;

    const lastPayment = await prisma.paymentTransaction.findFirst({
        where: { paymentOrder: { userId }, status: "SUCCESS" },
        orderBy: { createdAt: "desc" },
        include: { paymentOrder: true },
    });

    const pendingPayments = await prisma.paymentOrder.count({
        where: { userId, status: "PENDING" },
    });

    return {
        totalOrders,
        totalSpent,
        lastPayment: lastPayment
            ? {
                id: lastPayment.id,
                orderId: lastPayment.orderId,
                razorpayPaymentId: lastPayment.razorpayPaymentId,
                amountPaid: lastPayment.amountPaid,
                method: lastPayment.method,
                capturedAt: lastPayment.capturedAt,
                createdAt: lastPayment.createdAt,
            }
            : null,
        pendingPayments,
    };
}

export async function getRecentTransactions(userId: string, take = 5) {
    const transactions = await prisma.paymentTransaction.findMany({
        where: { paymentOrder: { userId } },
        orderBy: { createdAt: "desc" },
        take,
        include: {
            paymentOrder: {
                select: { id: true, amount: true, purpose: true, status: true },
            },
        },
    });

    return transactions.map((t) => ({
        id: t.id,
        orderId: t.orderId,
        razorpayPaymentId: t.razorpayPaymentId,
        amountPaid: t.amountPaid,
        method: t.method,
        status: t.status,
        createdAt: t.createdAt,
        order: t.paymentOrder,
    }));
}

export async function getActiveSubscription(userId: string) {
    const now = new Date();
    const subscription = await prisma.subscription.findFirst({
        where: {
            userId,
            status: "CONFIRMED",
            endDate: { gt: now },
        },
        include: { plan: true, PaymentOrder: true },
        orderBy: { updatedAt: "desc" },
    });

    if (!subscription) return null;

    return {
        id: subscription.id,
        plan: {
            id: subscription.plan.id,
            name: subscription.plan.name,
            price: subscription.plan.price,
            duration: subscription.plan.duration,
        },
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        status: subscription.status,
        relatedOrders: subscription.PaymentOrder.map((o) => ({
            id: o.id,
            amount: o.amount,
            status: o.status,
            createdAt: o.createdAt,
        })),
    };
}

export async function getPendingOrders(userId: string, take = 10) {
    const orders = await prisma.paymentOrder.findMany({
        where: { userId, status: "PENDING" },
        orderBy: { createdAt: "desc" },
        take,
        include: { items: true, booking: true, subscription: true },
    });

    return orders.map((o) => ({
        id: o.id,
        razorpayOrderId: o.razorpayOrderId,
        amount: o.amount,
        currency: o.currency,
        purpose: o.purpose,
        createdAt: o.createdAt,
        booking: o.booking ? { id: o.booking.id, serviceId: o.booking.serviceId, status: o.booking.status } : null,
        subscription: o.subscription ? { id: o.subscription.id, planId: o.subscription.planId } : null,
        itemsCount: o.items?.length ?? 0,
    }));
}

export async function getUpcomingBookings(userId: string, take = 5) {
    const now = new Date();
    const bookings = await prisma.serviceBooking.findMany({
        where: {
            userId,
            status: { in: ["SCHEDULED", "PENDING"] },
        },
        orderBy: { createdAt: "desc" },
        take,
        include: {
            service: { select: { id: true, name: true, price: true } },
            slot: { select: { startTime: true, endTime: true } },
            PaymentOrder: true,
        },
    });

    return bookings.map((b) => ({
        id: b.id,
        service: b.service,
        slot: b.slot,
        status: b.status,
        beforeImageUrl: b.beforeImageUrl,
        afterImageUrl: b.afterImageUrl,
        paymentOrders: b.PaymentOrder.map((o) => ({ id: o.id, amount: o.amount, status: o.status })),
        createdAt: b.createdAt,
    }));
}

export const getAllPayments = async (
    take: number = 10,
    skip: number = 0,
    search?: string,
    status?: string,
    purpose?: string
) => {
    try {
        const payments = await prisma.paymentOrder.findMany({
            where: {
                ...(search && {
                    OR: [
                        { razorpayOrderId: { contains: search, mode: "insensitive" } },
                        { user: { name: { contains: search, mode: "insensitive" } } },
                        { user: { email: { contains: search, mode: "insensitive" } } },
                        { user: { phone: { contains: search, mode: "insensitive" } } },
                    ],
                }),
                ...(status && { status: status as any }),
                ...(purpose && { purpose: purpose as any }),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        address: {
                            select: {
                                street: true,
                                city: true,
                                state: true,
                                postalCode: true,
                                country: true,
                            },
                        },
                    },
                },
                transaction: {
                    select: {
                        id: true,
                        razorpayPaymentId: true,
                        status: true,
                        method: true,
                        amountPaid: true,
                        capturedAt: true,
                        errorReason: true,
                    },
                },
                booking: {
                    select: {
                        id: true,
                        status: true,
                        service: {
                            select: {
                                id: true,
                                name: true,
                                price: true,
                            },
                        },
                    },
                },
                subscription: {
                    select: {
                        id: true,
                        plan: {
                            select: {
                                id: true,
                                name: true,
                                price: true,
                            },
                        },
                        startDate: true,
                        endDate: true,
                        status: true,
                    },
                },
                items: {
                    select: {
                        id: true,
                        product: {
                            select: {
                                id: true,
                                name: true,
                                price: true,
                            },
                        },
                        quantity: true,
                        price: true,
                        subtotal: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            take,
            skip,
        })

        const total = await prisma.paymentOrder.count({
            where: {
                ...(search && {
                    OR: [
                        { razorpayOrderId: { contains: search, mode: "insensitive" } },
                        { user: { name: { contains: search, mode: "insensitive" } } },
                        { user: { email: { contains: search, mode: "insensitive" } } },
                        { user: { phone: { contains: search, mode: "insensitive" } } },
                    ],
                }),
                ...(status && { status: status as any }),
                ...(purpose && { purpose: purpose as any }),
            },
        })

        return { payments, total }
    } catch (error) {
        console.error("Error fetching all payments:", error)
        throw error
    }
}
