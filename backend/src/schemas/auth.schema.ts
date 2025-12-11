import { z } from "zod"

/* ----------------------------- USER SCHEMAS ----------------------------- */

export const signupSchema = z.object({
    name: z.string().min(3, { message: "Name must be at least 3 characters long" }),
    email: z.string().email({ message: "Invalid email address" }),
    phone: z.string().min(10, { message: "Phone number must be at least 10 digits" }).optional(),
    password: z.string().min(6, { message: "Password must be at least 6 characters long" }),
    address: z.object({
        street: z.string().min(1, { message: "Street is required" }),
        city: z.string().min(1, { message: "City is required" }),
        state: z.string().min(1, { message: "State is required" }),
        postalCode: z.string().min(1, { message: "Postal code is required" }),
        country: z.string().min(1, { message: "Country is required" }),
    }),
    whatsappNumber: z.string().min(10, { message: "WhatsApp number must be at least 10 digits" }).optional(),
})
export type SignupInput = z.infer<typeof signupSchema>

export const updateUserSchema = signupSchema.partial()

export const signinSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters long" }),
    rememberMe: z.boolean().optional(),
})
export type SigninInput = z.infer<typeof signinSchema>

/* ------------------------- PASSWORD RELATED SCHEMAS ------------------------- */

export const forgotPasswordSchema = z.object({
    email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1, "Token is required"),
    newPassword: z.string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter"),
});

export const verifyResetTokenSchema = z.object({
    token: z.string().min(1, "Token is required"),
});

export const updatePasswordSchema = z.object({
    oldPassword: z.string().min(6, { message: "Old password must be at least 6 characters long" }),
    newPassword: z.string().min(6, { message: "New password must be at least 6 characters long" }),
})
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>

/* ----------------------------- ADMIN SCHEMAS ----------------------------- */

export const adminSignInSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(1, { message: "Password must be at least 1 characters long" }),
})
export type AdminSignInInput = z.infer<typeof adminSignInSchema>

export const adminCreateSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(1, { message: "Password must be at least 1 characters long" }),
    name: z.string().min(2, { message: "Name must be at least 2 characters long" }),
})
