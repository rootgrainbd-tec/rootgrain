"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth/Providers";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, Mail } from "lucide-react";
import { toast } from "sonner";

type VerifyState = "verifying" | "success" | "error" | "no-token";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { refreshSession, isAuthenticated } = useAuth();
  const [state, setState] = useState<VerifyState>(token ? "verifying" : "no-token");
  const [errorMessage, setErrorMessage] = useState("");
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!token) return;

    const verify = async () => {
      try {
        const res = await fetch("/api/v1/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();

        if (res.ok && data.success) {
          setState("success");
          await refreshSession();
        } else {
          setState("error");
          setErrorMessage(data.error?.message || "Invalid or expired token.");
        }
      } catch {
        setState("error");
        setErrorMessage("Something went wrong. Please try again.");
      }
    };

    verify();
  }, [token, refreshSession]);

  const handleResend = async () => {
    setIsResending(true);
    try {
      const res = await fetch("/api/v1/auth/resend-verification", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "If your account is unverified, a new link has been sent.");
      } else {
        toast.error("Please log in first to resend verification.");
      }
    } catch {
      toast.error("Failed to resend. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-[70vh] bg-[#fcfaf8] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-6 shadow sm:rounded-lg sm:px-10 border border-gray-100 text-center">
          {state === "verifying" && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-[var(--walnut)] mx-auto mb-4" />
              <h1 className="text-xl font-serif text-[var(--walnut-dark)] mb-2">Verifying your email…</h1>
              <p className="text-sm text-gray-600">Please wait while we verify your email address.</p>
            </>
          )}

          {state === "success" && (
            <>
              <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-green-100 mb-4">
                <CheckCircle2 className="h-7 w-7 text-green-600" />
              </div>
              <h1 className="text-xl font-serif text-[var(--walnut-dark)] mb-2">Email Verified!</h1>
              <p className="text-sm text-gray-600 mb-6">
                Your email has been successfully verified. You now have full access to your account.
              </p>
              <Button asChild className="w-full bg-[var(--walnut-dark)] hover:bg-[var(--gold)] text-white">
                <Link href="/account">Go to Dashboard</Link>
              </Button>
            </>
          )}

          {state === "error" && (
            <>
              <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-red-100 mb-4">
                <XCircle className="h-7 w-7 text-red-600" />
              </div>
              <h1 className="text-xl font-serif text-[var(--walnut-dark)] mb-2">Verification Failed</h1>
              <p className="text-sm text-gray-600 mb-6">{errorMessage}</p>
              <div className="space-y-3">
                {isAuthenticated && (
                  <Button
                    onClick={handleResend}
                    disabled={isResending}
                    className="w-full bg-[var(--walnut-dark)] hover:bg-[var(--gold)] text-white"
                  >
                    {isResending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
                    {isResending ? "Sending…" : "Resend Verification Email"}
                  </Button>
                )}
                <Button asChild variant="outline" className="w-full">
                  <Link href="/login">Back to Login</Link>
                </Button>
              </div>
            </>
          )}

          {state === "no-token" && (
            <>
              <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-amber-100 mb-4">
                <Mail className="h-7 w-7 text-amber-600" />
              </div>
              <h1 className="text-xl font-serif text-[var(--walnut-dark)] mb-2">No Verification Token</h1>
              <p className="text-sm text-gray-600 mb-6">
                This link is missing a verification token. Please check the link in your email or request a new one.
              </p>
              <div className="space-y-3">
                {isAuthenticated && (
                  <Button
                    onClick={handleResend}
                    disabled={isResending}
                    className="w-full bg-[var(--walnut-dark)] hover:bg-[var(--gold)] text-white"
                  >
                    {isResending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {isResending ? "Sending…" : "Resend Verification Email"}
                  </Button>
                )}
                <Button asChild variant="outline" className="w-full">
                  <Link href="/login">Back to Login</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

import { Suspense } from "react";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[70vh] bg-[#fcfaf8] flex flex-col justify-center py-12 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--walnut)] mx-auto" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
