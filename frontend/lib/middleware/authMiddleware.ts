import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";

interface MiddlewareOptions {
  onUnauthorized?: () => void;
  redirectDelay?: number; 
  showDialog?: boolean;
}

export function useAuthMiddleware(options: MiddlewareOptions = {}) {
  const router = useRouter();
  const { user } = useAuth();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const {
    onUnauthorized,
    redirectDelay = 5000, 
    showDialog = true,
  } = options;

  const requireAuth = () => {
    if (!user || !user.id) {
      onUnauthorized?.();

      if (showDialog) {
        setShowAuthDialog(true);
        
        const timer = setTimeout(() => {
          router.push("/auth/signin");
        }, redirectDelay);

        return () => clearTimeout(timer);
      } else {
        router.push("/auth/signin");
      }
    }

    setIsCheckingAuth(false);
    return null;
  };

  return {
    isCheckingAuth,
    showAuthDialog,
    setShowAuthDialog,
    requireAuth,
    isAuthenticated: !!user && !!user.id,
  };
}
