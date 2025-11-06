import jwt, { SignOptions, JwtPayload } from "jsonwebtoken"
import { JWT_SECRET, JWT_EXPIRES_IN } from "../config/env"

export function generateToken(payload: string | object | Buffer): string {
    const options: SignOptions = {
        expiresIn: JWT_EXPIRES_IN as any
    }

    return jwt.sign(payload, JWT_SECRET as string, options)
}

export function verifyToken<T extends JwtPayload>(token: string): T {
    return jwt.verify(token, JWT_SECRET as string) as T
}
