// backend/src/controllers/paymentgateway.controller.ts
import { FastifyRequest, FastifyReply } from "fastify"
import { razorpay } from "../utils/razorpay"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { createRazorpayOrder, verifyRazorpaySignature } from "@/lib/createRazorpayOrder"
import { createSubscription } from "@/services/subscription.service"
import { getEmailSubject, getEmailTemplate } from "@/utils/emailTemplates"
import { emailQueue } from "@/queues/email.queue"

interface Payload {
    paymentFor: "SERVICE" | "PRODUCT" | "SUBSCRIPTION" | "OTHER"
    serviceId?: string
    subscriptionPlanId?: string
    products?: { productId: string; quantity: number }[]
}

export const createOrder = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
        const userId = req.user?.userId
        if (!userId) return reply.code(401).send({ error: "Unauthorized" })

        const { paymentFor, serviceId, subscriptionPlanId, products } = req.body as Payload

        let prismaPurpose: "SERVICE_BOOKING" | "PRODUCT_PURCHASE" | "SUBSCRIPTION" | "OTHER" = "OTHER"
        let totalAmount = 0

        // track created subscription id (if any)
        let createdSubscriptionId: string | null = null

        // Determine purpose
        switch (paymentFor) {
            case "PRODUCT":
                prismaPurpose = "PRODUCT_PURCHASE"
                break
            case "SERVICE":
                prismaPurpose = "SERVICE_BOOKING"
                break
            case "SUBSCRIPTION":
                prismaPurpose = "SUBSCRIPTION"
                break
            default:
                return reply.code(400).send({ error: "Invalid payment purpose" })
        }

        // Product purchase flow
        let productItems: { productId: string; quantity: number; price: number; subtotal: number }[] = []

        if (paymentFor === "PRODUCT") {
            if (!products || !Array.isArray(products) || products.length === 0)
                return reply.code(400).send({ error: "Products array is required for product purchase" })

            const productIds = products.map((p: any) => p.productId)
            const dbProducts = await prisma.product.findMany({ where: { id: { in: productIds } } })

            if (dbProducts.length === 0)
                return reply.code(404).send({ error: "No valid products found" })

            for (const item of products) {
                const product = dbProducts.find(p => p.id === item.productId)
                if (!product)
                    return reply.code(400).send({ error: `Invalid product ID: ${item.productId}` })

                const quantity = item.quantity && item.quantity > 0 ? item.quantity : 1
                const subtotal = Number(product.price) * quantity

                totalAmount += subtotal

                productItems.push({
                    productId: product.id,
                    quantity,
                    price: Number(product.price),
                    subtotal
                })
            }
        }

        // Service booking flow
        if (paymentFor === "SERVICE") {
            if (!serviceId) return reply.code(400).send({ error: "Service ID is required" })

            const service = await prisma.serviceDefinition.findUnique({ where: { id: serviceId } })
            if (!service) return reply.code(404).send({ error: "Service not found" })

            totalAmount = Number(service.price ?? 0)
        }

        // Subscription plan flow
        if (paymentFor === "SUBSCRIPTION") {
            if (!subscriptionPlanId) return reply.code(400).send({ error: "Subscription plan ID is required" })

            const plan = await prisma.subscriptionPlan.findUnique({ where: { id: subscriptionPlanId } })
            if (!plan) return reply.code(404).send({ error: "Subscription plan not found" })

            totalAmount = Number(plan.price)

            // create subscription record here where `plan` and `subscriptionPlanId` are known/validated
            try {
                const subscription = await createSubscription(userId, subscriptionPlanId);
                createdSubscriptionId = subscription.id
            } catch (subscriptionError) {
                logger.error("Failed to create subscription", subscriptionError)
                return reply.code(500).send({ error: "Failed to create subscription", details: subscriptionError instanceof Error ? subscriptionError.message : String(subscriptionError) })
            }
        }

        if (totalAmount <= 0)
            return reply.code(400).send({ error: "Invalid total amount" })

        const razorpayOrder = await createRazorpayOrder(totalAmount)

        // Create PaymentOrder record (Single DB op; nested items created atomically)
        const paymentOrder = await prisma.paymentOrder.create({
            data: {
                razorpayOrderId: razorpayOrder.id,
                amount: totalAmount,
                userId,
                purpose: prismaPurpose,
                bookingId: paymentFor === "SERVICE" ? serviceId : null,
                // use the created subscription id (or null)
                subscriptionId: paymentFor === "SUBSCRIPTION" ? createdSubscriptionId : null,
                items: paymentFor === "PRODUCT"
                    ? {
                        create: productItems.map(p => ({
                            productId: p.productId,
                            quantity: p.quantity,
                            price: p.price,
                            subtotal: p.subtotal
                        }))
                    }
                    : undefined
            },
            include: {
                items: { include: { product: true } }
            }
        })

        return reply.code(201).send({
            success: true,
            message: "Order created successfully",
            key: process.env.RAZORPAY_KEY_ID,
            razorpayOrder,
            paymentOrder
        })

    } catch (error: unknown) {
        logger.error(error)
        const details = error instanceof Error ? error.message : String(error)
        return reply.code(500).send({ error: "Failed to create order", details })
    }
}

export const verifyPayment = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
        const { orderId, paymentId, signature, paymentFor } = req.body as any;

        if (!orderId || !paymentId || !signature) {
            return reply.code(400).send({ success: false, message: "Missing required fields" });
        }

        if (!verifyRazorpaySignature(orderId, paymentId, signature)) {
            logger.warn("Razorpay signature verification failed", { orderId, paymentId })
            return reply.code(400).send({ success: false, message: "Invalid payment signature" });
        }

        const paymentOrder = await prisma.paymentOrder.findUnique({
            where: { razorpayOrderId: orderId },
            include: {
                user: true,
                items: {
                    include: { product: true }
                }
            }
        });

        if (!paymentOrder) {
            return reply.code(404).send({ success: false, message: "Payment order not found" });
        }

        const existingSuccess = await prisma.paymentTransaction.findFirst({
            where: { orderId: paymentOrder.id, status: "SUCCESS" }
        })
        if (existingSuccess) {
            return reply.send({ success: true, message: "Payment already recorded", transaction: existingSuccess })
        }

        const existingByRzpId = await prisma.paymentTransaction.findFirst({
            where: { razorpayPaymentId: paymentId }
        })
        if (existingByRzpId) {
            return reply.send({ success: true, message: "Payment already recorded", transaction: existingByRzpId })
        }

        const razorpayPayment = await razorpay.payments.fetch(paymentId);

        const expectedPaise = Math.round(Number(paymentOrder.amount) * 100);
        if (Number(razorpayPayment.amount) !== expectedPaise) {
            logger.error("Payment amount mismatch", { expectedPaise, received: razorpayPayment.amount, orderId, paymentId })
            return reply.code(400).send({ success: false, message: "Payment amount mismatch" });
        }

        const rzpStatus = (razorpayPayment.status || "").toString().toLowerCase();
        if (rzpStatus !== "captured" && rzpStatus !== "authorized") {
            logger.error("Razorpay payment not captured/authorized", { status: razorpayPayment.status, orderId, paymentId })
            return reply.code(400).send({ success: false, message: "Payment not captured" });
        }

        const amountPaid = Number(razorpayPayment.amount) / 100.0;

        // Fetch related data for email templates
        let serviceDetails = null;
        let subscriptionDetails = null;

        if (paymentOrder.purpose === "SERVICE_BOOKING" && paymentOrder.bookingId) {
            serviceDetails = await prisma.serviceBooking.findUnique({
                where: { id: paymentOrder.bookingId },
                include: { service: true }
            });
        }

        if (paymentOrder.subscriptionId) {
            subscriptionDetails = await prisma.subscription.findUnique({
                where: { id: paymentOrder.subscriptionId },
                include: { plan: true }
            });
        }

        const transaction = await prisma.$transaction(async (tx) => {
            const createdTx = await tx.paymentTransaction.create({
                data: {
                    orderId: paymentOrder.id,
                    razorpayPaymentId: paymentId,
                    razorpaySignature: signature,
                    status: "SUCCESS",
                    method: razorpayPayment.method ?? undefined,
                    amountPaid: amountPaid,
                    capturedAt: new Date(),
                },
            });

            await tx.paymentOrder.update({
                where: { id: paymentOrder.id },
                data: { status: "SUCCESS" },
            });

            if (paymentOrder.subscriptionId) {
                await tx.subscription.update({
                    where: { id: paymentOrder.subscriptionId },
                    data: { status: "CONFIRMED" },
                });
            }
            else if (paymentOrder.purpose === "SERVICE_BOOKING" && paymentOrder.bookingId) {
                await tx.serviceBooking.update({
                    where: { id: paymentOrder.bookingId },
                    data: { status: "IN_PROGRESS" },
                });
            }
            else if (paymentOrder.purpose === "PRODUCT_PURCHASE") {
                const items = await tx.paymentOrderItem.findMany({
                    where: { orderId: paymentOrder.id }
                });

                for (const item of items) {
                    const product = await tx.product.findUnique({ where: { id: item.productId } });
                    if (!product) {
                        throw new Error(`Product not found: ${item.productId}`);
                    }
                    const inv = Number(product.inventory ?? 0);
                    if (inv < item.quantity) {
                        throw new Error(`Insufficient inventory for product ${item.productId}`);
                    }
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { inventory: { decrement: item.quantity } }
                    });
                }
            }

            return createdTx;
        });

        // Queue email with detailed information
        const emailSubject = getEmailSubject(paymentOrder.purpose);
        const emailHtml = getEmailTemplate(
            paymentOrder.purpose,
            paymentOrder.user?.name || "User",
            paymentOrder,
            paymentOrder.items || [],
            serviceDetails,
            subscriptionDetails,
            amountPaid
        );
        
        try {
            await emailQueue.add(`payment-confirmation-${paymentOrder.id}`, {
                to: paymentOrder.user?.email,
                subject: emailSubject,
                message: `Payment of ₹${amountPaid} confirmed`,
                html: emailHtml
            }, {
                jobId: `payment-${paymentOrder.id}-${Date.now()}`,
                attempts: 3,
                backoff: { type: 'exponential', delay: 1000 }
            });
            logger.info(`Payment confirmation email queued for ${paymentOrder.id}`);
        } catch (emailQueueError) {
            logger.error("Failed to queue payment confirmation email", emailQueueError);
        }

        return reply.send({ success: true, message: "Payment verified", transaction });
    } catch (err) {
        logger.error(err);
        const details = err instanceof Error ? err.message : String(err);
        return reply.code(500).send({ error: "Payment verification failed", details });
    }
}


export const cancelPayment = async (req: FastifyRequest, reply: FastifyReply) => {
    const { orderId } = req.body as any
    // verify with user id for security
    const userId = req.user?.userId
    if (!userId) return reply.code(401).send({ error: "Unauthorized" })

    try {
        if (!orderId) return reply.code(400).send({ error: "orderId is required" })

        // Find order first, ensure it belongs to user
        const paymentOrder = await prisma.paymentOrder.findUnique({ where: { razorpayOrderId: orderId } })
        if (!paymentOrder) return reply.code(404).send({ error: "Payment order not found" })
        if (paymentOrder.userId !== userId) return reply.code(403).send({ error: "Forbidden" })

        // Perform entire cancellation flow in a single transaction to ensure atomicity
        await prisma.$transaction(async (tx) => {
            await tx.paymentOrder.update({
                where: { id: paymentOrder.id },
                data: { status: "CANCELLED" }
            });

            if (paymentOrder.subscriptionId) {
                await tx.subscription.update({
                    where: { id: paymentOrder.subscriptionId },
                    data: { status: "CANCELLED" }
                });
            } else if (paymentOrder.purpose === "SERVICE_BOOKING" && paymentOrder.bookingId) {
                // delete service booking if any
                await tx.serviceBooking.delete({
                    where: { id: paymentOrder.bookingId }
                });
            } else if (paymentOrder.purpose === "PRODUCT_PURCHASE") {
                // restock products
                const items = await tx.paymentOrderItem.findMany({
                    where: { orderId: paymentOrder.id }
                });
                for (const item of items) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { inventory: { increment: item.quantity } }
                    });
                }
            }
        });

        return reply.send({ success: true })
    } catch (err: unknown) {
        req.log.error(err)
        const details = err instanceof Error ? err.message : String(err)
        return reply.code(500).send({ error: "Failed to cancel payment", details })
    }
}
