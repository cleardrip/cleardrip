import { FastifyReply } from "fastify"
import { NODE_ENV } from "../config/env"

export function setAuthCookie(reply: FastifyReply, token: string, role: 'USER' | 'ADMIN' | 'SUPER_ADMIN') {
    let cookieName = 'user_token'

    if (role === 'ADMIN') {
        cookieName = 'admin_token'
    } else if (role === 'SUPER_ADMIN') {
        cookieName = 'super_admin_token'
    }
    removeAuthCookie(reply);
    reply.setCookie(cookieName, token, {
        httpOnly: true,
        secure: NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 // 7 days
    })
}

// Remove the cookie
export function removeAuthCookie(reply: FastifyReply) {
    reply.clearCookie('user_token')
    reply.clearCookie('admin_token')
    reply.clearCookie('super_admin_token')
}