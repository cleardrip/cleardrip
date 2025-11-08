import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export const generatePasswordResetToken = async (userId: string) => {
    try {
        // Generate secure random 32-byte token
        const plainToken = crypto.randomBytes(32).toString('hex');
        
        // Hash token before storing (never store plain tokens)
        const hashedToken = crypto
            .createHash('sha256')
            .update(plainToken)
            .digest('hex');
        
        // Set expiry to 30 minutes from now
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
        
        // Delete any existing unused tokens for this user
        await prisma.passwordResetToken.deleteMany({
            where: {
                userId,
                usedAt: null,
            },
        });
        
        // Create new reset token record
        const tokenRecord = await prisma.passwordResetToken.create({
            data: {
                userId,
                token: hashedToken,
                plainToken, // Store temporarily to send in email
                expiresAt,
            },
        });
        
        return { plainToken, tokenRecord };
    } catch (error) {
        console.error('Error generating reset token:', error);
        throw new Error('Failed to generate reset token');
    }
};

/**
 * Verify if a password reset token is valid
 * Checks: token exists, not expired, not already used
 */
export const verifyPasswordResetToken = async (plainToken: string) => {
    try {
        // Hash the provided plain token for database lookup
        const hashedToken = crypto
            .createHash('sha256')
            .update(plainToken)
            .digest('hex');
        
        // Find token record
        const tokenRecord = await prisma.passwordResetToken.findUnique({
            where: { token: hashedToken },
            include: { user: true },
        });
        
        if (!tokenRecord) {
            return { 
                valid: false, 
                error: 'Invalid reset token',
                code: 'INVALID_TOKEN'
            };
        }
        
        // Check if token has expired
        const now = new Date();
        if (now > tokenRecord.expiresAt) {
            return { 
                valid: false, 
                error: 'Reset token has expired. Please request a new one.',
                code: 'TOKEN_EXPIRED'
            };
        }
        
        // Check if token has already been used
        if (tokenRecord.usedAt) {
            return { 
                valid: false, 
                error: 'This reset token has already been used.',
                code: 'TOKEN_USED'
            };
        }
        
        return { 
            valid: true, 
            tokenRecord, 
            user: tokenRecord.user 
        };
    } catch (error) {
        console.error('Error verifying reset token:', error);
        return { 
            valid: false, 
            error: 'Failed to verify token',
            code: 'VERIFICATION_ERROR'
        };
    }
};

export const resetUserPassword = async (plainToken: string, newPassword: string) => {
    try {
        // Verify token validity
        const verification = await verifyPasswordResetToken(plainToken);
        
        if (!verification.valid) {
            throw new Error(verification.error);
        }
        
        // Hash new password with bcrypt
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Hash the token for database lookup
        const hashedToken = crypto
            .createHash('sha256')
            .update(plainToken)
            .digest('hex');
        
        // Update user password in transaction
        const updatedUser = await prisma.$transaction(async (tx) => {
            // Update user password
            const user = await tx.user.update({
                where: { id: verification.user!.id },
                data: { password: hashedPassword },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    createdAt: true,
                },
            });
            
            // Mark token as used
            await tx.passwordResetToken.update({
                where: { token: hashedToken },
                data: { usedAt: new Date() },
            });
            
            return user;
        });
        
        return updatedUser;
    } catch (error) {
        console.error('Error resetting password:', error);
        throw error;
    }
};

export const deleteExpiredTokens = async () => {
    try {
        const result = await prisma.passwordResetToken.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date(), // Less than current time
                },
            },
        });
        
        return result;
    } catch (error) {
        console.error('Error deleting expired tokens:', error);
        throw error;
    }
};
