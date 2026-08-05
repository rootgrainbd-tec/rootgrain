"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Mail, Loader2, X } from "lucide-react";
import { toast } from "sonner";

export function VerificationBanner() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";
  const user = session?.user;
  const [isResending, setIsResending] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Don't render if loading, not authenticated, already verified, or dismissed
  if (isLoading || !isAuthenticated || !user || user.emailVerified || dismissed) {
    return null;
  }

  const handleResend = async () => {
    setIsResending(true);
    try {
      const res = await fetch("/api/v1/auth/resend-verification", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Verification email sent.");
      } else {
        toast.error("Failed to send verification email.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div
      className="bg-amber-50 border-b border-amber-200 px-4 py-3"
      role="alert"
      aria-label="Email verification required"
    >
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <p className="text-sm font-medium">
            Please verify your email address to access all features.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResend}
            disabled={isResending}
            className="border-amber-300 text-amber-800 hover:bg-amber-100 text-xs h-8"
          >
            {isResending ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <Mail className="h-3 w-3 mr-1" />
            )}
            {isResending ? "Sending…" : "Resend Email"}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-amber-600 hover:text-amber-800 hover:bg-amber-100"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss verification banner"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
