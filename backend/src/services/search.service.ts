import { prisma } from "@/lib/prisma";

export async function searchAll(query: string) {
    const [services, products, plans] = await Promise.all([
        prisma.serviceDefinition.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { description: { contains: query, mode: 'insensitive' } }
                ],
                isActive: true
            },
            select: {
                id: true,
                name: true,
                description: true,
                type: true,
                image: true,
                price: true,
                duration: true
            }
        }),

        prisma.product.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { description: { contains: query, mode: 'insensitive' } }
                ]
            },
            select: {
                id: true,
                name: true,
                description: true,
                image: true,
                price: true,
                inventory: true
            }
        }),

        prisma.subscriptionPlan.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { description: { contains: query, mode: 'insensitive' } }
                ]
            },
            select: {
                id: true,
                name: true,
                description: true,
                price: true,
                duration: true
            }
        })
    ]);

    return {
        services,
        products,
        plans
    };
}
