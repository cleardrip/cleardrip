import { z } from "zod"

export const requestOtpSchema = z.object({
    phone: z.string().optional(),
    email: z.string().email().optional(),
}).refine(data => data.phone || data.email, {
    message: "Either phone or email is required",
    path: ["_global"],
})
export type RequestOtpInput = z.infer<typeof requestOtpSchema>

export const verifyOtpSchema = z.object({
    phone: z.string().min(10).optional(),
    email: z.string().email().optional(),
    phoneOtp: z.string().length(6).optional(),
    emailOtp: z.string().length(6).optional(),
}).refine(data => data.phone || data.email, {
    message: "Either phone or email is required",
    path: ["_global"],
})
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>

// { "phoneOtp": "123456", "emailOtp": "123456", "phone": "+919721235063", "email": "bcs220340.rky@goel.edu.in" }