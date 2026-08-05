"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

function GoogleOnboardingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { update } = useSession();

  // These values would be passed from the OAuth callback
  const prefillName = searchParams.get("name") || "";
  const prefillEmail = searchParams.get("email") || "";
  const providerAccountId = searchParams.get("providerAccountId") || "";

  const [name, setName] = useState(prefillName);
  const [phone, setPhone] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  if (!prefillEmail || !providerAccountId) {
    return (
      <div className="min-h-[70vh] bg-[#fcfaf8] flex flex-col items-center justify-center py-12 px-4 text-center">
        <h1 className="text-2xl font-serif text-[var(--walnut-dark)] mb-4">Invalid Onboarding Link</h1>
        <p className="text-gray-600 mb-6">This page requires a valid Google authentication session.</p>
        <Button asChild className="bg-[var(--walnut-dark)] hover:bg-[var(--gold)] text-white">
          <Link href="/login">Back to Login</Link>
        </Button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!name.trim() || name.trim().length < 2) {
      setServerError("Name must be at least 2 characters.");
      return;
    }

    if (!acceptTerms) {
      setServerError("You must accept the terms and conditions.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/v1/auth/google/complete-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: prefillEmail,
          providerAccountId,
          phone: phone.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Account created! Welcome to RootGrain.");
        await update();
        router.push("/account");
      } else {
        setServerError(data.error?.message || "Failed to create account.");
      }
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] bg-[#fcfaf8] flex flex-col items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md border-[var(--walnut)]/20 shadow-xl">
        <CardHeader className="space-y-2 text-center pb-6">
          <CardTitle className="text-3xl font-serif text-[var(--walnut)]">
            Complete Your Profile
          </CardTitle>
          <CardDescription className="text-[var(--walnut-light)] text-base">
            Just a few more details to set up your RootGrain account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name (editable) */}
            <div className="space-y-2">
              <Label htmlFor="google-name" className="text-[var(--walnut)]">Full Name</Label>
              <Input
                id="google-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
                className="border-[var(--walnut)]/30 focus-visible:ring-[var(--gold)]"
              />
            </div>

            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label htmlFor="google-email" className="text-[var(--walnut)]">Email</Label>
              <Input
                id="google-email"
                value={prefillEmail}
                disabled
                className="border-[var(--walnut)]/30 bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">Verified by Google — cannot be changed.</p>
            </div>

            {/* Phone (optional) */}
            <div className="space-y-2">
              <Label htmlFor="google-phone" className="text-[var(--walnut)]">
                Phone Number <span className="text-muted-foreground font-normal">(Optional)</span>
              </Label>
              <Input
                id="google-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+880 1XXX-XXXXXX"
                type="tel"
                autoComplete="tel"
                className="border-[var(--walnut)]/30 focus-visible:ring-[var(--gold)]"
              />
            </div>

            {/* Terms & Conditions */}
            <div className="flex items-start space-x-3">
              <Checkbox
                id="google-terms"
                checked={acceptTerms}
                onCheckedChange={(val) => setAcceptTerms(val === true)}
                aria-label="Accept terms and conditions"
              />
              <Label htmlFor="google-terms" className="text-sm text-[var(--walnut-light)] font-normal cursor-pointer leading-snug">
                I agree to the{" "}
                <Link href="/terms" className="text-[var(--gold)] underline" target="_blank">
                  Terms & Conditions
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-[var(--gold)] underline" target="_blank">
                  Privacy Policy
                </Link>
              </Label>
            </div>

            {serverError && (
              <p className="text-sm text-destructive text-center" role="alert">{serverError}</p>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[var(--walnut)] hover:bg-[var(--walnut-light)] text-white"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isLoading ? "Creating account…" : "Create Account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function GoogleOnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[70vh] bg-[#fcfaf8] flex flex-col justify-center py-12 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--walnut)] mx-auto" />
      </div>
    }>
      <GoogleOnboardingContent />
    </Suspense>
  );
}
