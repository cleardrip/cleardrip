'use client';

import React from 'react';
import { AuthService } from '@/lib/httpClient/userAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/core/Button';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

const Verify = () => {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [phone, setPhone] = React.useState<string | null>(null);
    const [email, setEmail] = React.useState<string | null>(null);
    const [phoneOtp, setPhoneOtp] = React.useState<string[]>(['', '', '', '', '', '']);
    const [emailOtp, setEmailOtp] = React.useState<string[]>(['', '', '', '', '', '']);
    const [message, setMessage] = React.useState<string | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [loading, setLoading] = React.useState<boolean>(false);
    const [phoneResendTimer, setPhoneResendTimer] = React.useState<number>(60);
    const [emailResendTimer, setEmailResendTimer] = React.useState<number>(60);
    const [canResendPhone, setCanResendPhone] = React.useState<boolean>(false);
    const [canResendEmail, setCanResendEmail] = React.useState<boolean>(false);

    const phoneInputRefs = React.useRef<(HTMLInputElement | null)[]>([]);
    const emailInputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

    React.useEffect(() => {
        // Get phone and email from URL params or session storage
        const phoneParam = searchParams.get('phone') || sessionStorage.getItem('signupPhone');
        const emailParam = searchParams.get('email') || sessionStorage.getItem('signupEmail');

        setPhone(phoneParam);
        setEmail(emailParam);

        // Start countdown timers
        const phoneTimer = setInterval(() => {
            setPhoneResendTimer((prev) => {
                if (prev <= 1) {
                    setCanResendPhone(true);
                    clearInterval(phoneTimer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        const emailTimer = setInterval(() => {
            setEmailResendTimer((prev) => {
                if (prev <= 1) {
                    setCanResendEmail(true);
                    clearInterval(emailTimer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            clearInterval(phoneTimer);
            clearInterval(emailTimer);
        };
    }, [searchParams]);

    const handleOtpChange = (
        index: number,
        value: string,
        isPhone: boolean
    ) => {
        if (!/^\d*$/.test(value)) return;

        const newOtp = isPhone ? [...phoneOtp] : [...emailOtp];
        newOtp[index] = value.slice(-1);

        if (isPhone) {
            setPhoneOtp(newOtp);
        } else {
            setEmailOtp(newOtp);
        }

        // Auto-focus next input
        if (value && index < 5) {
            const refs = isPhone ? phoneInputRefs : emailInputRefs;
            refs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (
        e: React.KeyboardEvent<HTMLInputElement>,
        index: number,
        isPhone: boolean
    ) => {
        const refs = isPhone ? phoneInputRefs : emailInputRefs;

        if (e.key === 'Backspace' && !e.currentTarget.value && index > 0) {
            refs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (
        e: React.ClipboardEvent<HTMLInputElement>,
        isPhone: boolean
    ) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        const newOtp = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);

        if (isPhone) {
            setPhoneOtp(newOtp);
        } else {
            setEmailOtp(newOtp);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        const phoneOtpString = phoneOtp.join('');
        const emailOtpString = emailOtp.join('');

        if ((!phoneOtpString && phone) || (!emailOtpString && email)) {
            setError("Please enter OTP first");
            setLoading(false);
            return;
        }

        try {
            const result = await AuthService.verifyOtp(phoneOtpString, emailOtpString, phone ?? undefined, email ?? undefined);
            setMessage(result.message || 'Verification successful!');

            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
                router.push('/user/dashboard');
            }, 2000);
        } catch (error: any) {
            setError(error.message || 'Verification failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResendPhoneOtp = async () => {
        if (!canResendPhone) return;

        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            await AuthService.sendOtp(phone ?? undefined, undefined);
            setMessage('Phone OTP resent successfully!');
            setCanResendPhone(false);
            setPhoneResendTimer(60);

            const timer = setInterval(() => {
                setPhoneResendTimer((prev) => {
                    if (prev <= 1) {
                        setCanResendPhone(true);
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } catch (error: any) {
            setError(error.message || 'Failed to resend phone OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleResendEmailOtp = async () => {
        if (!canResendEmail) return;

        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            await AuthService.sendOtp(undefined, email ?? undefined);
            setMessage('Email OTP resent successfully!');
            setCanResendEmail(false);
            setEmailResendTimer(60);

            const timer = setInterval(() => {
                setEmailResendTimer((prev) => {
                    if (prev <= 1) {
                        setCanResendEmail(true);
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } catch (error: any) {
            setError(error.message || 'Failed to resend email OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
            <Card className="w-full max-w-2xl shadow-lg">
                <CardHeader className="space-y-1 px-4 sm:px-6 pt-6 pb-4">
                    <CardTitle className="text-xl sm:text-2xl font-bold text-center">Verify Your Account</CardTitle>
                    <CardDescription className="text-center text-sm sm:text-base">
                        Enter the verification codes sent to your contact information
                    </CardDescription>
                </CardHeader>

                <CardContent className="px-4 sm:px-6 pb-6">
                    {/* Alert Messages */}
                    {(message || error) && (
                        <Alert className={`mb-4 sm:mb-6 ${error ? 'border-red-500 bg-red-50 text-red-800' : 'border-green-500 bg-green-50 text-green-800'}`}>
                            {error ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                            <AlertDescription className="text-sm">{error || message}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                        {/* Phone OTP Section */}
                        {phone && (
                            <div className="space-y-2 sm:space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-700">Phone Verification</h3>
                                        <p className="text-xs text-gray-500 break-all">Code sent to {phone}</p>
                                    </div>
                                    <div className="text-right">
                                        {canResendPhone ? (
                                            <button
                                                type="button"
                                                onClick={handleResendPhoneOtp}
                                                disabled={loading}
                                                className="text-blue-600 text-xs font-semibold hover:underline disabled:opacity-50"
                                            >
                                                Resend
                                            </button>
                                        ) : (
                                            <p className="text-xs text-gray-500">
                                                {phoneResendTimer}s
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-1.5 sm:gap-2 justify-center">
                                    {phoneOtp.map((digit, index) => (
                                        <input
                                            key={index}
                                            ref={(el) => { phoneInputRefs.current[index] = el; }}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(index, e.target.value, true)}
                                            onKeyDown={(e) => handleKeyDown(e, index, true)}
                                            onPaste={(e) => handlePaste(e, true)}
                                            className="w-9 h-11 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                            aria-label={`Phone OTP digit ${index + 1}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Email OTP Section */}
                        {email && (
                            <div className="space-y-2 sm:space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-700">Email Verification</h3>
                                        <p className="text-xs text-gray-500 break-all">Code sent to {email}</p>
                                    </div>
                                    <div className="text-right">
                                        {canResendEmail ? (
                                            <button
                                                type="button"
                                                onClick={handleResendEmailOtp}
                                                disabled={loading}
                                                className="text-blue-600 text-xs font-semibold hover:underline disabled:opacity-50"
                                            >
                                                Resend
                                            </button>
                                        ) : (
                                            <p className="text-xs text-gray-500">
                                                {emailResendTimer}s
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-1.5 sm:gap-2 justify-center">
                                    {emailOtp.map((digit, index) => (
                                        <input
                                            key={index}
                                            ref={(el) => { emailInputRefs.current[index] = el; }}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(index, e.target.value, false)}
                                            onKeyDown={(e) => handleKeyDown(e, index, false)}
                                            onPaste={(e) => handlePaste(e, false)}
                                            className="w-9 h-11 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                            aria-label={`Email OTP digit ${index + 1}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            className="w-full h-11 sm:h-12 text-sm sm:text-base"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Verifying...</span>
                                </div>
                            ) : (
                                'Verify Account'
                            )}
                        </Button>

                        {/* Back Link */}
                        <div className="text-center text-xs sm:text-sm text-gray-600">
                            <Link href="/user/dashboard" className="text-blue-600 hover:underline">
                                Go Back
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default Verify;