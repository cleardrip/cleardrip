'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { AuthService } from '@/lib/httpClient/userAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/core/Button';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// format phone number to +91XXXXXXXXXX
const formatPhoneNumber = (phone?: string | null): string | undefined => {
    if (!phone) return undefined;
    const digits = phone.replace(/\D/g, '');
    if (!digits) return undefined;

    // Remove leading zeros
    let trimmed = digits.replace(/^0+/, '');

    // If starts with 91 and total length > 12 (duplicated code), collapse it
    if (/^(91){2,}\d+/.test(trimmed)) {
        // remove repeated 91 occurrences at start, keep one
        trimmed = '91' + trimmed.replace(/^(91)+/, '');
    }

    // If already in full form 91 + 10 digits
    if (/^91\d{10}$/.test(trimmed)) {
        return `+${trimmed}`;
    }

    // If local 10-digit number, apply +91
    if (/^\d{10}$/.test(trimmed)) {
        return `+91${trimmed}`;
    }

    // Fallback: prefix plus (E.164-ish, caller should ensure correctness)
    return `+${trimmed}`;
};

const Verify = () => {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [phone, setPhone] = useState<string | null>(null);
    const [email, setEmail] = useState<string | null>(null);
    const [phoneOtp, setPhoneOtp] = useState<string[]>(['', '', '', '', '', '']);
    const [emailOtp, setEmailOtp] = useState<string[]>(['', '', '', '', '', '']);
    // REPLACED global message/error/loading with per-channel state
    const [phoneMessage, setPhoneMessage] = useState<string | null>(null);
    const [phoneError, setPhoneError] = useState<string | null>(null);
    const [phoneLoading, setPhoneLoading] = useState<boolean>(false);
    const [phoneVerified, setPhoneVerified] = useState<boolean>(false);
    const [emailMessage, setEmailMessage] = useState<string | null>(null);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [emailLoading, setEmailLoading] = useState<boolean>(false);
    const [emailVerified, setEmailVerified] = useState<boolean>(false);
    const [phoneResendTimer, setPhoneResendTimer] = useState<number>(6);
    const [emailResendTimer, setEmailResendTimer] = useState<number>(6);
    const [canResendPhone, setCanResendPhone] = useState<boolean>(false);
    const [canResendEmail, setCanResendEmail] = useState<boolean>(false);

    const phoneInputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const emailInputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
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

    // REMOVED handleSubmit; ADD per-channel verify handlers
    const handleVerifyPhoneOtp = async () => {
        if (!phone) return;
        const phoneOtpString = phoneOtp.join('');
        if (phoneOtpString.length !== 6) {
            setPhoneError('Enter full 6-digit phone OTP');
            return;
        }
        setPhoneLoading(true);
        setPhoneError(null);
        setPhoneMessage(null);
        try {
            const formattedPhone = phone;
            // const formattedPhone = formatPhoneNumber(phone);
            const result = await AuthService.verifyOtp(phoneOtpString, undefined, formattedPhone, undefined);
            setPhoneMessage(result.message || 'Phone verified!');
            setPhoneVerified(true);
            attemptRedirectAfterBothVerified(true, emailVerified);
        } catch (err: any) {
            setPhoneError(err.message || 'Phone verification failed');
        } finally {
            setPhoneLoading(false);
        }
    };

    const handleVerifyEmailOtp = async () => {
        if (!email) return;
        const emailOtpString = emailOtp.join('');
        if (emailOtpString.length !== 6) {
            setEmailError('Enter full 6-digit email OTP');
            return;
        }
        setEmailLoading(true);
        setEmailError(null);
        setEmailMessage(null);
        try {
            const result = await AuthService.verifyOtp(undefined, emailOtpString, undefined, email);
            setEmailMessage(result.message || 'Email verified!');
            setEmailVerified(true);
            attemptRedirectAfterBothVerified(phoneVerified, true);
        } catch (err: any) {
            setEmailError(err.message || 'Email verification failed');
        } finally {
            setEmailLoading(false);
        }
    };

    // Redirect when all provided channels are verified
    const attemptRedirectAfterBothVerified = (phoneDone: boolean, emailDone: boolean) => {
        const phoneNeeded = !!phone;
        const emailNeeded = !!email;
        if ((phoneNeeded ? phoneDone : true) && (emailNeeded ? emailDone : true)) {
            setTimeout(() => {
                router.push('/user/dashboard');
            }, 1500);
        }
    };

    const handleResendPhoneOtp = async () => {
        if (!canResendPhone) return;

        setPhoneLoading(true);
        setPhoneError(null);
        setPhoneMessage(null);

        try {
            const formattedPhone = formatPhoneNumber(phone);
            await AuthService.sendOtp(formattedPhone, undefined);
            setPhoneMessage('Phone OTP resent successfully!');
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
            setPhoneError(error.message || 'Failed to resend phone OTP');
        } finally {
            setPhoneLoading(false);
        }
    };

    const handleResendEmailOtp = async () => {
        if (!canResendEmail) return;

        setEmailLoading(true);
        setEmailError(null);
        setEmailMessage(null);

        try {
            await AuthService.sendOtp(undefined, email ?? undefined);
            setEmailMessage('Email OTP resent successfully!');
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
            setEmailError(error.message || 'Failed to resend email OTP');
        } finally {
            setEmailLoading(false);
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
                    {/* REMOVED global alert */}
                    {/* Phone OTP Section */}
                    {phone && (
                        <div className="space-y-2 sm:space-y-3 mb-6">
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
                                            disabled={phoneLoading}
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
                                        className={`w-9 h-11 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold border-2 rounded-lg outline-none transition-all ${phoneVerified ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                                            }`}
                                        aria-label={`Phone OTP digit ${index + 1}`}
                                        disabled={phoneVerified}
                                    />
                                ))}
                            </div>
                            {(phoneMessage || phoneError) && (
                                <Alert className={`mt-2 ${phoneError ? 'border-red-500 bg-red-50 text-red-800' : 'border-green-500 bg-green-50 text-green-800'}`}>
                                    {phoneError ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                                    <AlertDescription className="text-sm">{phoneError || phoneMessage}</AlertDescription>
                                </Alert>
                            )}
                            <Button
                                type="button"
                                onClick={handleVerifyPhoneOtp}
                                disabled={phoneLoading || phoneVerified}
                                className="w-full h-10 text-sm"
                            >
                                {phoneLoading ? 'Verifying...' : phoneVerified ? 'Phone Verified' : 'Verify Phone'}
                            </Button>
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
                                            disabled={emailLoading}
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
                                        className={`w-9 h-11 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold border-2 rounded-lg outline-none transition-all ${emailVerified ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                                            }`}
                                        aria-label={`Email OTP digit ${index + 1}`}
                                        disabled={emailVerified}
                                    />
                                ))}
                            </div>
                            {(emailMessage || emailError) && (
                                <Alert className={`mt-2 ${emailError ? 'border-red-500 bg-red-50 text-red-800' : 'border-green-500 bg-green-50 text-green-800'}`}>
                                    {emailError ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                                    <AlertDescription className="text-sm">{emailError || emailMessage}</AlertDescription>
                                </Alert>
                            )}
                            <Button
                                type="button"
                                onClick={handleVerifyEmailOtp}
                                disabled={emailLoading || emailVerified}
                                className="w-full h-10 text-sm"
                            >
                                {emailLoading ? 'Verifying...' : emailVerified ? 'Email Verified' : 'Verify Email'}
                            </Button>
                        </div>
                    )}

                    {/* Back Link */}
                    <div className="text-center text-xs sm:text-sm text-gray-600 mt-6">
                        <Link href="/user/dashboard" className="text-blue-600 hover:underline">
                            Go Back
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

const VerifyWithSuspense = () => {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
            <Verify />
        </Suspense>
    )
}

export default VerifyWithSuspense;