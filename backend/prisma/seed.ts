// To run this seed file run command : npx ts-node prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting database seeding...');

    // Clear existing data
    await prisma.notification.deleteMany();
    await prisma.tDSLog.deleteMany();
    await prisma.subscription.deleteMany();
    await prisma.serviceBooking.deleteMany();
    await prisma.serviceDefinition.deleteMany();
    await prisma.oTPSession.deleteMany();
    // await prisma.slot.deleteMany();
    await prisma.tDSLog.deleteMany();
    await prisma.user.deleteMany();
    await prisma.whatsAppLog.deleteMany();
    await prisma.address.deleteMany();
    await prisma.admin.deleteMany();
    await prisma.product.deleteMany();
    await prisma.subscription.deleteMany();
    await prisma.subscriptionPlan.deleteMany();

    // Hash passwords
    const userPassword = await bcrypt.hash('12345678', 10);
    const adminPassword = await bcrypt.hash('12345678', 10);

    // Create addresses
    const addresses = await Promise.all([
        prisma.address.create({
            data: {
                street: '123 Main Street, Apt 4B',
                city: 'Mumbai',
                state: 'Maharashtra',
                postalCode: '400001',
                country: 'India'
            }
        }),
        prisma.address.create({
            data: {
                street: '456 Park Avenue',
                city: 'Delhi',
                state: 'Delhi',
                postalCode: '110001',
                country: 'India'
            }
        }),
        prisma.address.create({
            data: {
                street: '789 Gandhi Road',
                city: 'Bangalore',
                state: 'Karnataka',
                postalCode: '560001',
                country: 'India'
            }
        }),
        prisma.address.create({
            data: {
                street: '321 Nehru Street',
                city: 'Chennai',
                state: 'Tamil Nadu',
                postalCode: '600001',
                country: 'India'
            }
        })
    ]);

    // Create users
    const users = await Promise.all([
        prisma.user.create({
            data: {
                name: 'Rohit Kuyada',
                email: 'rohitkuyada@gmail.com',
                phone: '+91-9876543210',
                password: userPassword,
                whatsappNumber: '+916392177974',
                loyaltyStatus: 'GOLD',
                addressId: addresses[0].id
            }
        }),
        prisma.user.create({
            data: {
                name: 'Priya Sharma',
                email: 'priya.sharma@gmail.com',
                phone: '+91-9876543211',
                password: userPassword,
                loyaltyStatus: 'SILVER',
                addressId: addresses[1].id
            }
        }),
        prisma.user.create({
            data: {
                name: 'Amit Patel',
                email: 'amit.patel@gmail.com',
                phone: '+91-9876543212',
                password: userPassword,
                loyaltyStatus: 'PLATINUM',
                addressId: addresses[2].id
            }
        }),
        prisma.user.create({
            data: {
                name: 'Sneha Reddy',
                email: 'sneha.reddy@gmail.com',
                phone: '+91-9876543213',
                password: userPassword,
                loyaltyStatus: 'BRONZE',
                addressId: addresses[3].id
            }
        }),
        prisma.user.create({
            data: {
                name: 'Rajesh Kumar',
                email: 'rajesh.kumar@gmail.com',
                phone: '+91-9876543214',
                password: userPassword,
                loyaltyStatus: 'GOLD'
            }
        })
    ]);

    // Fix: Explicitly type dummyLogs
    const dummyLogs: { userId: string; tdsValue: number; timestamp: Date }[] = []
    const count = 1000; // number of dummy logs to create

    for (let i = 0; i < count; i++) {
        dummyLogs.push({
            userId: users[Math.floor(Math.random() * users.length)].id,
            tdsValue: Math.floor(Math.random() * 100) + 1, // random value between 1–100
            timestamp: new Date(Date.now() - i * 60 * 60 * 1000), // past i hours
        })
    }

    const result = await prisma.tDSLog.createMany({
        data: dummyLogs,
    })

    console.log(`${result.count} dummy TDS logs inserted.`)

    // Create admins
    const admins = await Promise.all([
        prisma.admin.create({
            data: {
                name: 'Super Admin',
                email: 'superadmin@gmail.com',
                password: adminPassword,
                role: 'SUPERADMIN'
            }
        }),
        prisma.admin.create({
            data: {
                name: 'Staff Admin',
                email: 'staff@gmail.com',
                password: adminPassword,
                role: 'STAFF'
            }
        })
    ]);

    // Create products
    const products = await Promise.all([
        prisma.product.create({
            data: {
                name: 'Water Purifier Filter',
                price: 1200.00,
                description: 'High-quality replacement filter for water purifiers',
                inventory: 50,
                image: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=400&h=400&fit=crop&crop=center"
            }
        }),
        prisma.product.create({
            data: {
                name: 'UV Lamp',
                price: 800.00,
                description: 'UV sterilization lamp for water purification',
                inventory: 30,
                image: "https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=400&h=400&fit=crop&crop=center"
            }
        }),
        prisma.product.create({
            data: {
                name: 'Membrane Cartridge',
                price: 2500.00,
                description: 'RO membrane cartridge for reverse osmosis systems',
                inventory: 25,
                image: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=400&fit=crop&crop=center"
            }
        }),
        prisma.product.create({
            data: {
                name: 'Pre-filter Set',
                price: 600.00,
                description: 'Set of 3 pre-filters for water purification system',
                inventory: 40,
                image: "https://images.unsplash.com/photo-1563298723-dcfebaa392e3?w=400&h=400&fit=crop&crop=center"
            }
        }),
        prisma.product.create({
            data: {
                name: 'Storage Tank',
                price: 3500.00,
                description: '10L storage tank for purified water',
                inventory: 15,
                image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&crop=center"
            }
        })
    ]);

    console.log(`Creating Service Definitions By Admin`);
    const serviceDefinitions = await Promise.all([
        prisma.serviceDefinition.create({
            data: {
                name: 'Water Purification',
                description: 'Comprehensive water purification service',
                price: 1500.00,
                duration: 120,
                adminId: admins[0].id,
                type: 'AMC',
                image: 'https://cloudinary.com/sample-service-1.jpg',
                isActive: true
            }
        }),
        prisma.serviceDefinition.create({
            data: {
                name: 'RO System Installation',
                description: 'Installation of reverse osmosis water purification systems',
                price: 3000.00,
                duration: 180,
                adminId: admins[0].id,
                type: 'URGENT',
                image: 'https://www.thespruce.com/thmb/qnLXdzgIGZPAUE5Bhw2OF-8u67s=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/installing-a-reverse-osmosis-system-2718849-08-9339294fdfb54895898ae3a1aa3d3913.jpg',
                isActive: true
            }
        }),
        prisma.serviceDefinition.create({
            data: {
                name: 'Annual Maintenance Contract',
                description: 'Yearly maintenance contract for water purification systems',
                price: 5000.00,
                duration: 365,
                adminId: admins[1].id,
                type: 'AMC',
                image: 'https://cloudinary.com/sample-service-3.jpg',
                isActive: true
            }
        })
    ]);
    console.log('Created service definitions:', serviceDefinitions.length);

    // Create default Subscription Plans
    const subscriptionPlans = await Promise.all([
        prisma.subscriptionPlan.create({
            data: {
                name: "Basic",
                description: "Access to basic features",
                price: 199,
                duration: 30, // 30 days
            },
        }),
        prisma.subscriptionPlan.create({
            data: {
                name: "Standard",
                description: "Access to standard features",
                price: 499,
                duration: 90, // 3 months
            },
        }),
        prisma.subscriptionPlan.create({
            data: {
                name: "Premium",
                description: "Access to premium features",
                price: 999,
                duration: 180, // 6 months
            },
        }),
        prisma.subscriptionPlan.create({
            data: {
                name: "Annual",
                description: "Full access for 1 year",
                price: 1999,
                duration: 365, // 1 year
            },
        }),
        prisma.subscriptionPlan.create({
            data: {
                name: "Lifetime",
                description: "One-time payment for lifetime access",
                price: 4999,
                duration: 36500, // roughly 100 years as a placeholder
            },
        }),
    ]);

    console.log("Default subscription plans created:", subscriptionPlans.length);


    // Create ServiceBookings along with slots by the User
    console.log(`Creating Service Bookings`);
    const slots = await Promise.all([
        // Slot 1 with one service
        prisma.slot.create({
            data: {
                startTime: new Date('2025-08-27T10:04:00'),
                endTime: new Date('2025-08-27T11:05:00'),
                bookings: {
                    create: {
                        userId: users[0].id,
                        serviceId: serviceDefinitions[0].id,
                        beforeImageUrl: 'https://cloudinary.com/sample-before-1.jpg',
                        afterImageUrl: 'https://cloudinary.com/sample-after-1.jpg',
                        status: 'IN_PROGRESS',
                        createdAt: new Date(),
                        updatedAt: new Date()
                    },
                },
            },
            include: { bookings: true },
        }),

        // Slot 2 with one service
        prisma.slot.create({
            data: {
                startTime: new Date('2025-08-27T14:30:00'),
                endTime: new Date('2025-08-27T15:30:00'),
                bookings: {
                    create: {
                        userId: users[1].id,
                        serviceId: serviceDefinitions[1].id,
                        beforeImageUrl: 'https://cloudinary.com/sample-before-2.jpg',
                        afterImageUrl: 'https://cloudinary.com/sample-after-2.jpg',
                        status: 'IN_PROGRESS',
                        createdAt: new Date(),
                        updatedAt: new Date()
                    },
                },
            },
            include: { bookings: true },
        }),

        // Slot 3 with one service
        prisma.slot.create({
            data: {
                startTime: new Date('2025-08-28T10:04:00'),
                endTime: new Date('2025-08-28T11:05:00'),
                bookings: {
                    create: {
                        userId: users[2].id,
                        serviceId: serviceDefinitions[2].id,
                        status: 'SCHEDULED',
                    },
                },
            },
            include: { bookings: true },
        }),

        // Slot 4 with one service
        prisma.slot.create({
            data: {
                startTime: new Date('2025-09-18T16:15:00'),
                endTime: new Date('2025-09-18T17:17:00'),
                bookings: {
                    create: {
                        userId: users[0].id,
                        serviceId: serviceDefinitions[0].id,
                        status: 'PENDING',
                    },
                },
            },
            include: { bookings: true },
        }),

        // Slot 5 with one service
        prisma.slot.create({
            data: {
                startTime: new Date('2024-12-10T11:00:00'),
                endTime: new Date('2024-12-10T12:00:00'),
                bookings: {
                    create: {
                        userId: users[3].id,
                        serviceId: serviceDefinitions[1].id,
                        beforeImageUrl: 'https://cloudinary.com/sample-before-3.jpg',
                        afterImageUrl: 'https://cloudinary.com/sample-after-3.jpg',
                        status: 'COMPLETED',
                        createdAt: new Date(),
                        updatedAt: new Date()
                    },
                },
            },
            include: { bookings: true },
        }),
    ]);

    console.log('Seeded slots with services:', slots.length);


    // Create subscriptions
    const subscriptions = await Promise.all([
        prisma.subscription.create({
            data: {
                userId: users[0].id,
                planId: subscriptionPlans[0].id,
                startDate: new Date('2024-01-01'),
                endDate: new Date(new Date('2024-01-01').setDate(new Date('2024-01-01').getDate() + subscriptionPlans[0].duration))
            }
        }),
        prisma.subscription.create({
            data: {
                userId: users[1].id,
                planId: subscriptionPlans[1].id,
                startDate: new Date('2024-12-01'),
                endDate: new Date(new Date('2024-01-01').setDate(new Date('2024-01-01').getDate() + subscriptionPlans[1].duration))
            }
        }),
        prisma.subscription.create({
            data: {
                userId: users[2].id,
                planId: subscriptionPlans[2].id,
                startDate: new Date('2024-06-01'),
                endDate: new Date(new Date('2024-01-01').setDate(new Date('2024-01-01').getDate() + subscriptionPlans[2].duration))
            }
        }),
        prisma.subscription.create({
            data: {
                userId: users[4].id, planId: subscriptionPlans[3].id,
                startDate: new Date('2024-10-01'),
                endDate: new Date(new Date('2024-01-01').setDate(new Date('2024-01-01').getDate() + subscriptionPlans[3].duration))
            }
        })
    ]);

    // Create TDS logs
    const tdsLogs = await Promise.all([
        prisma.tDSLog.create({
            data: {
                userId: users[0].id,
                tdsValue: 25,
                timestamp: new Date('2024-12-01T08:00:00')
            }
        }),
        prisma.tDSLog.create({
            data: {
                userId: users[0].id,
                tdsValue: 30,
                timestamp: new Date('2024-12-02T08:00:00')
            }
        }),
        prisma.tDSLog.create({
            data: {
                userId: users[1].id,
                tdsValue: 45,
                timestamp: new Date('2024-12-01T09:00:00')
            }
        }),
        prisma.tDSLog.create({
            data: {
                userId: users[2].id,
                tdsValue: 15,
                timestamp: new Date('2024-12-01T10:00:00')
            }
        }),
        prisma.tDSLog.create({
            data: {
                userId: users[3].id,
                tdsValue: 60,
                timestamp: new Date('2024-12-01T11:00:00')
            }
        })
    ]);

    // Create notifications
    const notifications = await Promise.all([
        prisma.notification.create({
            data: {
                userId: users[0].id,
                type: 'FCM',
                message: 'Your AMC service is completed. Thank you for choosing our services!',
                status: 'SENT',
                sentAt: new Date('2024-12-01T10:30:00')
            }
        }),
        prisma.notification.create({
            data: {
                userId: users[1].id,
                type: 'WHATSAPP',
                message: 'Your urgent service request is now in progress. Our technician will reach you shortly.',
                status: 'SENT',
                sentAt: new Date('2024-12-15T14:45:00')
            }
        }),
        prisma.notification.create({
            data: {
                userId: users[2].id,
                type: 'EMAIL',
                message: 'Your AMC service is scheduled for Dec 20, 2024 at 9:00 AM. Please be available.',
                status: 'PENDING'
            }
        }),
        prisma.notification.create({
            data: {
                userId: users[0].id,
                type: 'FCM',
                message: 'Your TDS level is 30 ppm. Your water quality is excellent!',
                status: 'SENT',
                sentAt: new Date('2024-12-02T08:15:00')
            }
        }),
        prisma.notification.create({
            data: {
                userId: users[3].id,
                type: 'WHATSAPP',
                message: 'Your service request has been cancelled. Please contact support for more details.',
                status: 'FAILED'
            }
        })
    ]);

    // Create WhatsApp logs
    const whatsappLogs = await Promise.all([
        prisma.whatsAppLog.create({
            data: {
                userId: users[0].id,
                messageType: 'TEXT',
                content: 'Hello! Your AMC service is scheduled for tomorrow at 10 AM.',
                timestamp: new Date('2024-11-30T18:00:00')
            }
        }),
        prisma.whatsAppLog.create({
            data: {
                userId: users[1].id,
                messageType: 'BUTTON',
                content: 'Would you like to reschedule your service? Click Yes or No.',
                timestamp: new Date('2024-12-14T10:00:00')
            }
        }),
        prisma.whatsAppLog.create({
            data: {
                userId: users[2].id,
                messageType: 'IMAGE',
                content: 'Here is the before image of your water purifier service.',
                timestamp: new Date('2024-12-01T09:30:00')
            }
        }),
        prisma.whatsAppLog.create({
            data: {
                userId: users[0].id,
                messageType: 'TEXT',
                content: 'Thank you for your feedback! We are glad to serve you.',
                timestamp: new Date('2024-12-01T11:00:00')
            }
        }),
        prisma.whatsAppLog.create({
            data: {
                userId: users[3].id,
                messageType: 'AUDIO',
                content: 'Voice message about service cancellation details.',
                timestamp: new Date('2024-12-10T15:00:00')
            }
        })
    ]);

    // Create OTP sessions
    // const otpSessions = await Promise.all([
    //     prisma.oTPSession.create({
    //         data: {
    //             userId: users[0].id,
    //             otpCode: '123456',
    //             channel: 'EMAIL',
    //             expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
    //             verified: true
    //         }
    //     }),
    //     prisma.oTPSession.create({
    //         data: {
    //             userId: users[1].id,
    //             otpCode: '789012',
    //             channel: 'PHONE',
    //             expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
    //             verified: false
    //         }
    //     }),
    //     prisma.oTPSession.create({
    //         data: {
    //             userId: users[2].id,
    //             otpCode: '345678',
    //             channel: 'EMAIL',
    //             expiresAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago (expired)
    //             verified: false
    //         }
    //     }),
    //     prisma.oTPSession.create({
    //         data: {
    //             userId: users[3].id,
    //             otpCode: '901234',
    //             channel: 'PHONE',
    //             expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
    //             verified: true
    //         }
    //     })
    // ]);

    console.log('Database seeding completed successfully!');
    console.log(`Created ${users.length} users`);
    console.log(`Created ${admins.length} admins`);
    console.log(`Created ${products.length} products`);
    // console.log(`Created ${services.length} services`);
    console.log(`Created ${subscriptions.length} subscriptions`);
    console.log(`Created ${tdsLogs.length} TDS logs`);
    console.log(`Created ${notifications.length} notifications`);
    console.log(`Created ${whatsappLogs.length} WhatsApp logs`);
    // console.log(`Created ${otpSessions.length} OTP sessions`);
    console.log(`Created ${addresses.length} addresses`);
}

main()
    .catch((e) => {
        console.error('Error during seeding:', e);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });