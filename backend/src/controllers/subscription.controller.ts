import { logger } from "@/lib/logger";
import { SubscriptionPlanSchema } from "@/schemas/subscriptionSchema";
import { createSubscription, createSubscriptionPlans, deleteSubscriptionById, getAllSubscriptionsPlans, getSubscription, getSubscriptionPlanById, isSubscriptionPlanUsed, toggleSubscriptionPlanActiveStatus } from "@/services/subscription.service";
import { sendError } from "@/utils/errorResponse";
import { FastifyReply, FastifyRequest } from "fastify";

function isValidPlanId(planId: string): boolean {
    return typeof planId === "string" && planId.trim().length > 0;
}

// View Current Subscription Plan
export const GetCurrentSubscriptionPlanHandler = async (req: FastifyRequest, res: FastifyReply) => {
    const userId = req.user?.userId;
    if (!userId) {
        return sendError(res, 400, "Unauthorised request...");
    }
    try {
        const subscription = await getSubscription(userId);
        if (!subscription) {
            return sendError(res, 404, "No active subscription found.", "No active subscription found.");
        }
        return res.status(200).send({
            message: "Current subscription plan retrieved successfully.",
            success: true,
            data: subscription,
        });
    } catch (error) {
        logger.error(error);
        return sendError(res, 500, "Internal server error.");
    }
}

export const SubscribeToPlanHandler = async (req: FastifyRequest, res: FastifyReply) => {
    const userId = req.user?.userId;
    if (!userId) {
        return sendError(res, 400, "Unauthorised request...");
    }
    const { planId } = req.body as { planId: string };
    if (!planId || !isValidPlanId(planId)) {
        return sendError(res, 400, "Missing planId or duration.");
    }
    try {
        const subscription = await getSubscription(userId);
        if (subscription) {
            return sendError(res, 400, "User already has an active subscription.");
        }
        const newSubscription = await createSubscription(userId, planId);
        // Will improve this later to handle different plans and durations
        if (!newSubscription) {
            return sendError(res, 400, "Failed to create subscription.");
        }
        return res.status(201).send({
            message: "Subscription created successfully.",
            success: true,
            data: newSubscription,
        });
    } catch (error) {
        logger.error(error);
        return sendError(res, 500, "Internal server error.");
    }
}

export const GetAllSubscriptionsDetailsHandler = async (req: FastifyRequest, res: FastifyReply) => {
    try {
        const subscriptions = await getAllSubscriptionsPlans();
        if (!subscriptions) {
            return sendError(res, 404, "No subscriptions found.");
        }
        return res.status(200).send({
            message: "All subscriptions retrieved successfully.",
            success: true,
            data: subscriptions,
        });
    } catch (error) {
        logger.error(error);
        return sendError(res, 500, "Internal server error.");
    }
}

export const CreateSubscriptionDetailsHandler = async (req: FastifyRequest, res: FastifyReply) => {
    const validation = SubscriptionPlanSchema.safeParse(req.body);
    if (!validation.success) {
        return sendError(res, 400, "Invalid subscription plan data.");
    }
    try {
        const newSubscription = await createSubscriptionPlans(validation.data);
        if (!newSubscription) {
            return sendError(res, 400, "Failed to create subscription.");
        }
        return res.status(201).send({
            message: "Subscription created successfully.",
            success: true,
            data: newSubscription,
        });
    } catch (error) {
        logger.error(error);
        return sendError(res, 500, "Internal server error.");
    }
}

export async function deleteSubscriptionHandler(req: FastifyRequest, res: FastifyReply) {
    const { id } = req.params as { id: string };
    if (!id) {
        return sendError(res, 400, 'Subscription id is required');
    }

    try {
        const subscription = await getSubscriptionPlanById(id);
        const isUsed = await isSubscriptionPlanUsed(id);
        if (isUsed) {
            return sendError(res, 400, 'Cannot delete subscription plan, you can make it inactive instead');
        }
        if (!subscription) {
            return sendError(res, 404, 'Subscription not found');
        }
        const deleted = await deleteSubscriptionById(id);
        if (!deleted) {
            return sendError(res, 404, 'Subscription not found');
        }

        return res.status(200).send({
            message: 'Subscription deleted successfully',
            success: true,
        });
    } catch (error) {
        logger.error(error);
        return sendError(res, 500, 'Internal server error');
    }
}

export async function ToggleSubscriptionActiveStatusHandler(req: FastifyRequest, res: FastifyReply) {
    const { id } = req.params as { id: string };
    if (!id) {
        return sendError(res, 400, 'Subscription id is required');
    }

    try {
        const subscription = await getSubscriptionPlanById(id);
        if (!subscription) {
            return sendError(res, 404, 'Subscription not found');
        }
        const updated = await toggleSubscriptionPlanActiveStatus(id, !subscription.isActive);
        if (!updated) {
            return sendError(res, 400, 'Failed to update subscription status');
        }
        return res.status(200).send({
            message: `Subscription ${updated.isActive ? 'activated' : 'deactivated'} successfully`,
            success: true,
            data: updated,
        });
    } catch (error) {
        logger.error(error);
        return sendError(res, 500, 'Internal server error');
    }
}