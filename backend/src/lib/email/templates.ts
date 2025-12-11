export class EmailTemplates {
    private static headerColor = "#2563EB"; // Blue-600
    private static companyName = "ClearDrip";
    private static logoUrl = "https://cleardrip.in/logo.png"; // Replace with actual logo URL if available, or text

    private static baseTemplate(title: string, content: string): string {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f5; }
                .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                .header { background-color: ${this.headerColor}; color: white; padding: 30px 20px; text-align: center; }
                .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
                .content { padding: 30px; color: #4b5563; }
                .button { display: inline-block; background-color: ${this.headerColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: 500; }
                .button:hover { background-color: #1d4ed8; }
                .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
                .otp-box { background-color: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold; border-radius: 6px; margin: 20px 0; }
                .highlight { color: ${this.headerColor}; font-weight: 600; }
                a { color: ${this.headerColor}; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>${title}</h1>
                </div>
                <div class="content">
                    ${content}
                </div>
                <div class="footer">
                    <p>&copy; ${new Date().getFullYear()} ${this.companyName}. All rights reserved.</p>
                    <p>This is an automated message, please do not reply.</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    static welcomeEmail(name: string, email: string): string {
        const content = `
            <p>Hello <span class="highlight">${name}</span>,</p>
            <p>Welcome to <strong>${this.companyName}</strong>! We are thrilled to have you on board.</p>
            <p>Your account has been successfully created with the email: ${email}.</p>
            <p>You can now explore our services and manage your profile.</p>
            <div style="text-align: center;">
                <a href="https://cleardrip.in/user/dashboard" class="button">Go to Dashboard</a>
            </div>
        `;
        return this.baseTemplate("Welcome to ClearDrip!", content);
    }

    static otpEmail(otp: string): string {
        const content = `
            <p>Hello,</p>
            <p>Your One-Time Password (OTP) for verification is below. This code is valid for <strong>5 minutes</strong>.</p>
            <div class="otp-box">${otp}</div>
            <p>If you did not request this code, please ignore this email.</p>
        `;
        return this.baseTemplate("Your OTP Code", content);
    }

    static passwordResetEmail(resetUrl: string, name: string): string {
        const content = `
            <p>Hi <span class="highlight">${name}</span>,</p>
            <p>You recently requested to reset your password for your ${this.companyName} account.</p>
            <p>Click the button below to reset it:</p>
            <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            <p style="margin-top: 30px; font-size: 13px;">Or copy and paste this link in your browser:</p>
            <p style="font-size: 13px; word-break: break-all;"><a href="${resetUrl}">${resetUrl}</a></p>
            <p><strong>Note:</strong> This link will expire in 30 minutes.</p>
            <p>If you didn't request a password reset, you can safely ignore this email.</p>
        `;
        return this.baseTemplate("Password Reset Request", content);
    }
}
