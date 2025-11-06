export const getEmailSubject = (purpose: string): string => {
    switch (purpose) {
        case "PRODUCT_PURCHASE":
            return "Order Confirmation - Thank You for Your Purchase!";
        case "SERVICE_BOOKING":
            return "Service Booking Confirmed";
        case "SUBSCRIPTION":
            return "Subscription Activated - Welcome!";
        default:
            return "Payment Confirmed";
    }
}

export const getEmailTemplate = (
    purpose: string,
    userName: string,
    paymentOrder: any,
    items: any[],
    serviceDetails: any,
    subscriptionDetails: any,
    amountPaid: number
): string => {
    const baseWrapper = (content: string) => `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; background-color: #f9f9f9; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
                .header h1 { margin: 0; font-size: 28px; }
                .content { background: white; padding: 30px; }
                .section { margin-bottom: 25px; }
                .section-title { font-size: 18px; font-weight: 600; color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px; margin-bottom: 15px; }
                .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
                .info-label { font-weight: 600; color: #555; }
                .info-value { color: #333; }
                .product-item, .service-item { background: #f5f5f5; padding: 15px; margin-bottom: 10px; border-left: 4px solid #667eea; }
                .product-name, .service-name { font-weight: 600; font-size: 16px; color: #333; margin-bottom: 5px; }
                .product-details { font-size: 14px; color: #666; }
                .amount-section { background: #f0f4ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .amount-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 16px; }
                .amount-row.total { font-size: 20px; font-weight: 700; color: #667eea; border-top: 2px solid #667eea; padding-top: 10px; margin-top: 10px; }
                .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: 600; }
                .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; }
                .footer p { margin: 5px 0; }
                table { width: 100%; border-collapse: collapse; }
                th { background: #f5f5f5; padding: 10px; text-align: left; font-weight: 600; border-bottom: 2px solid #ddd; }
                td { padding: 12px 10px; border-bottom: 1px solid #eee; }
                @media only screen and (max-width: 600px) {
                    .container { width: 100% !important; }
                    .content { padding: 20px !important; }
                    .info-row { flex-direction: column; }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✓ Payment Confirmed</h1>
                    <p style="margin: 10px 0 0 0;">Thank you for your purchase!</p>
                </div>
                <div class="content">
                    <p style="font-size: 16px; color: #333;">Hi ${userName},</p>
                    ${content}
                </div>
                <div class="footer">
                    <p><strong>Order ID:</strong> ${paymentOrder.razorpayOrderId}</p>
                    <p><strong>Transaction Date:</strong> ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p style="margin-top: 15px; color: #666;">If you have any questions, please contact us at <strong>cleardrip.solutions@gmail.com</strong></p>
                    <p style="margin-top: 10px; font-size: 11px;">© 2025 ClearDrip. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    switch (purpose) {
        case "PRODUCT_PURCHASE":
            // Calculate subtotal correctly
            const subtotal = items.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);
            
            return baseWrapper(`
                <div class="section">
                    <p>Your order has been successfully placed and paid. Below are your order details:</p>
                </div>

                <div class="section">
                    <div class="section-title">Order Items</div>
                    ${items.map(item => `
                        <div class="product-item">
                            <div class="product-name">${item.product?.name || 'Product'}</div>
                            <div class="product-details">
                                <div class="info-row">
                                    <span class="info-label">Quantity:</span>
                                    <span class="info-value">${item.quantity}</span>
                                </div>
                                <div class="info-row">
                                    <span class="info-label">Price per Unit:</span>
                                    <span class="info-value">₹${Number(item.price).toFixed(2)}</span>
                                </div>
                                <div class="info-row">
                                    <span class="info-label">Subtotal:</span>
                                    <span class="info-value" style="font-weight: 600; color: #667eea;">₹${Number(item.subtotal).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="section">
                    <div class="section-title">Shipping Address</div>
                    <div class="info-row">
                        <div style="color: #666;">
                            ${paymentOrder.user?.address || 'Address not provided'}<br>
                            ${paymentOrder.user?.city || ''} ${paymentOrder.user?.state || ''} ${paymentOrder.user?.zipCode || ''}<br>
                            ${paymentOrder.user?.phone || ''}
                        </div>
                    </div>
                </div>

                <div class="amount-section">
                    <div class="amount-row">
                        <span>Subtotal:</span>
                        <span>₹${subtotal.toFixed(2)}</span>
                    </div>
                    <div class="amount-row total">
                        <span>Total Paid:</span>
                        <span>₹${amountPaid.toFixed(2)}</span>
                    </div>
                </div>

                <div class="section">
                    <p style="color: #666;">You will receive tracking information shortly once your order ships. Thank you for your purchase!</p>
                </div>
            `);

        case "SERVICE_BOOKING":
            const scheduledDate = serviceDetails?.scheduledDate ? new Date(serviceDetails.scheduledDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'TBD';
            return baseWrapper(`
                <div class="section">
                    <p>Your service booking has been confirmed and paid. Our team will contact you shortly to finalize the details.</p>
                </div>

                <div class="section">
                    <div class="section-title">Service Details</div>
                    <div class="service-item">
                        <div class="service-name">${serviceDetails?.service?.name || 'Service'}</div>
                        <div class="product-details">
                            <div class="info-row">
                                <span class="info-label">Service Type:</span>
                                <span class="info-value">${serviceDetails?.service?.type || 'N/A'}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Description:</span>
                                <span class="info-value">${serviceDetails?.service?.description || 'N/A'}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Scheduled Date:</span>
                                <span class="info-value">${scheduledDate}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Booking Status:</span>
                                <span class="info-value" style="color: #22c55e; font-weight: 600;">Confirmed</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="amount-section">
                    <div class="amount-row">
                        <span>Service Amount:</span>
                        <span>₹${Number(serviceDetails?.service?.price || 0).toFixed(2)}</span>
                    </div>
                    <div class="amount-row total">
                        <span>Total Paid:</span>
                        <span>₹${amountPaid.toFixed(2)}</span>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">What's Next?</div>
                    <p>Our team will reach out to you at <strong>${paymentOrder.user?.phone || 'your registered phone'}</strong> to confirm the appointment time and address details.</p>
                    <p><strong>Contact Person:</strong> ${paymentOrder.user?.name || 'N/A'}</p>
                    <p><strong>Phone:</strong> ${paymentOrder.user?.phone || 'N/A'}</p>
                </div>
            `);

        case "SUBSCRIPTION":
            const planName = subscriptionDetails?.plan?.name || 'Premium Plan';
            const duration = subscriptionDetails?.plan?.duration || '1';
            const billingCycle = subscriptionDetails?.plan?.billingCycle || 'monthly';
            return baseWrapper(`
                <div class="section">
                    <p>Your subscription has been successfully activated! You now have access to all premium features.</p>
                </div>

                <div class="section">
                    <div class="section-title">Subscription Details</div>
                    <div class="service-item">
                        <div class="service-name">${planName}</div>
                        <div class="product-details">
                            <div class="info-row">
                                <span class="info-label">Plan Type:</span>
                                <span class="info-value">${planName}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Billing Cycle:</span>
                                <span class="info-value">${duration} ${billingCycle}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Status:</span>
                                <span class="info-value" style="color: #22c55e; font-weight: 600;">Active</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Renewal Date:</span>
                                <span class="info-value">${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="amount-section">
                    <div class="amount-row">
                        <span>Plan Amount (${duration} ${billingCycle}):</span>
                        <span>₹${Number(subscriptionDetails?.plan?.price || 0).toFixed(2)}</span>
                    </div>
                    <div class="amount-row total">
                        <span>Total Paid:</span>
                        <span>₹${amountPaid.toFixed(2)}</span>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">Manage Your Subscription</div>
                    <p>You can manage your subscription, change your plan, or cancel anytime from your account dashboard.</p>
                    <a href="${process.env.APP_URL}/user/dashboard" class="cta-button">Manage Subscription</a>
                </div>
            `);

        default:
            return baseWrapper(`
                <div class="section">
                    <p>Your payment of <strong>₹${amountPaid.toFixed(2)}</strong> has been processed successfully.</p>
                </div>

                <div class="section">
                    <div class="section-title">Payment Information</div>
                    <div class="info-row">
                        <span class="info-label">Order ID:</span>
                        <span class="info-value">${paymentOrder.razorpayOrderId}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Payment Status:</span>
                        <span class="info-value" style="color: #22c55e; font-weight: 600;">Successful</span>
                    </div>
                </div>

                <div class="amount-section">
                    <div class="amount-row total">
                        <span>Amount Paid:</span>
                        <span>₹${amountPaid.toFixed(2)}</span>
                    </div>
                </div>
            `);
    }
}
