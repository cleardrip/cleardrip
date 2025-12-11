"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Lock, ArrowRight } from "lucide-react";


interface AuthRequiredDialogProps {
  isOpen: boolean;
  onClose: () => void;
  redirectDelay?: number;
  actionType?: "payment" | "subscription" | "booking" | "product";
}


export function AuthRequiredDialog({
  isOpen,
  onClose,
  redirectDelay = 5000,
  actionType = "payment",
}: AuthRequiredDialogProps) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(0);
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(0);
      setHasRedirected(false);
      return;
    }

    const initialCountdown = Math.ceil(redirectDelay / 1000);
    setCountdown(initialCountdown);
    setHasRedirected(false);

    const redirectTimer = setTimeout(() => {
      setHasRedirected(true);
      router.push("/user/signin");
    }, redirectDelay);

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        const newCount = prev - 1;
        if (newCount <= 0) {
          return 0;
        }
        return newCount;
      });
    }, 1000);

    return () => {
      clearTimeout(redirectTimer);
      clearInterval(countdownInterval);
    };
  }, [isOpen, redirectDelay, router]);

  if (!isOpen) return null;

  const actionText = {
    payment: "make a payment",
    subscription: "subscribe to a plan",
    booking: "book a service",
    product: "purchase / add to cart"
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md shadow-2xl animate-in fade-in zoom-in">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-center mb-3 text-blue-900">
          Sign in Required
        </h2>

        <p className="text-center text-gray-600 mb-6">
          You need to be signed in to {actionText[actionType]}. Redirecting you to login in{" "}
          <span className="font-bold text-blue-600">{countdown}s</span>...
        </p>

        <div className="space-y-3">
          <Button
            onClick={() => router.push("/user/signin")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
          >
            Sign In Now
            <ArrowRight className="w-4 h-4" />
          </Button>

          <Button
            onClick={() => router.push("/user/signup")}
            variant="outline"
            className="w-full border-2 border-blue-600 text-blue-600 hover:bg-blue-50 py-3 rounded-lg font-semibold"
          >
            Create Account
          </Button>

          <Button
            onClick={onClose}
            variant="ghost"
            className="w-full text-gray-600 hover:bg-gray-100 py-3 rounded-lg"
          >
            Cancel
          </Button>
        </div>

        {/* Info text */}
        <p className="text-xs text-gray-500 text-center mt-6">
          We'll keep your preferences safe when you sign in
        </p>
      </div>
    </div>
  );
}
