'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`,
                { email },
                { withCredentials: true }
            );

            setMessage(response.data.message);
            setEmail('');

            // Redirect to login after 4 seconds
            setTimeout(() => {
                router.push('/user/signin');
            }, 4000);
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || 
                'Failed to send reset email. Please try again.';
            setError(errorMessage);
            console.error('Forgot password error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-lg shadow-md p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Forgot Password?
                        </h1>
                        <p className="text-gray-600">
                            No worries, we'll send you reset instructions.
                        </p>
                    </div>

                    {message && (
                        <div className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4">
                            <p className="text-sm font-medium text-green-800">
                                ✓ {message}
                            </p>
                            <p className="text-xs text-green-700 mt-2">
                                Redirecting to login in a few seconds...
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
                                htmlFor="email" 
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Email Address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                disabled={loading || !!message}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !!message}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                    Sending...
                                </span>
                            ) : (
                                'Send Reset Link'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-600 text-sm">
                            Remember your password?{' '}
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
