'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [tokenValid, setTokenValid] = useState(false);

    const [validating, setValidating] = useState(true);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Password validation state
    const [passwordValidation, setPasswordValidation] = useState({
        minLength: false,
        hasUppercase: false,
        hasNumber: false,
        hasLowercase: false,
    });

    // Verify token on mount
    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setError('No reset token provided in URL');
                setValidating(false);
                return;
            }

            try {
                const response = await axios.get(
                    `${process.env.NEXT_PUBLIC_API_URL}/auth/verify-reset-token?token=${token}`,
                    { withCredentials: true }
                );
                setTokenValid(response.data.valid);
            } catch (err: any) {
                const errorMsg = err.response?.data?.error ||
                    'Invalid or expired reset link';
                setError(errorMsg);
                setTokenValid(false);
            } finally {
                setValidating(false);
            }
        };

        verifyToken();
        // setValidating(false);
    }, [token]);

    // Validate password in real-time
    useEffect(() => {
        setPasswordValidation({
            minLength: newPassword.length >= 8,
            hasUppercase: /[A-Z]/.test(newPassword),
            hasNumber: /[0-9]/.test(newPassword),
            hasLowercase: /[a-z]/.test(newPassword),
        });
    }, [newPassword]);

    const isPasswordValid = Object.values(passwordValidation).every(v => v);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setMessage('');

        // Validate passwords match
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        // Validate password strength
        if (!isPasswordValid) {
            setError('Password does not meet all requirements');
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`,
                { token, newPassword },
                { withCredentials: true }
            );

            setMessage(response.data.message);
            setNewPassword('');
            setConfirmPassword('');

            // Redirect to login after 2 seconds
            setTimeout(() => {
                router.push('/user/signin');
            }, 2000);
        } catch (err: any) {
            const errorMsg = err.response?.data?.error ||
                'Failed to reset password. Please try again.';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    if (validating) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="text-center">
                    <div className="inline-block">
                        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    </div>
                    <p className="mt-4 text-gray-600 font-medium">Validating reset link...</p>
                </div>
            </div>
        );
    }

    if (!tokenValid || !token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
                <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8 text-center">
                    <div className="text-5xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Link Invalid or Expired
                    </h2>
                    <p className="text-red-600 mb-6">{error}</p>
                    <Link
                        href="/forgot-password"
                        className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition"
                    >
                        Request New Link
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-lg shadow-md p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Reset Your Password
                        </h1>
                        <p className="text-gray-600">
                            Create a strong password to secure your account
                        </p>
                    </div>

                    {message && (
                        <div className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4">
                            <p className="text-sm font-medium text-green-800">
                                ✓ {message}
                            </p>
                            <p className="text-xs text-green-700 mt-2">
                                Redirecting to login...
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
                            <p className="text-sm font-medium text-red-800">
                                ✕ {error}
                            </p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showNewPassword ? "text" : "password"}
                                    required
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    disabled={loading || !!message}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                >
                                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="confirm-password"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Confirm Password
                            </label>
                            <div className="relative">
                                <input
                                    id="confirm-password"
                                    name="confirm-password"
                                    type={showConfirmPassword ? "text" : "password"}
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm password"
                                    disabled={loading || !!message}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Password Requirements Checklist */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-sm font-medium text-gray-700 mb-3">
                                Password Requirements:
                            </p>
                            <ul className="space-y-2">
                                {[
                                    { key: 'minLength', label: 'At least 8 characters', valid: passwordValidation.minLength },
                                    { key: 'hasUppercase', label: 'At least one uppercase letter (A-Z)', valid: passwordValidation.hasUppercase },
                                    { key: 'hasNumber', label: 'At least one number (0-9)', valid: passwordValidation.hasNumber },
                                    { key: 'hasLowercase', label: 'At least one lowercase letter (a-z)', valid: passwordValidation.hasLowercase },
                                ].map(req => (
                                    <li key={req.key} className="flex items-center gap-2 text-sm">
                                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${req.valid
                                            ? 'bg-green-200 text-green-800'
                                            : 'bg-gray-200 text-gray-600'
                                            }`}>
                                            {req.valid ? '✓' : '○'}
                                        </span>
                                        <span className={req.valid ? 'text-green-700' : 'text-gray-600'}>
                                            {req.label}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !!message || !isPasswordValid}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                    Resetting...
                                </span>
                            ) : (
                                'Reset Password'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-600 text-sm">
                            <Link
                                href="/user/signin"
                                className="text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Back to Login
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ResetPassword() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ResetPasswordContent />
        </Suspense>
    );
}
