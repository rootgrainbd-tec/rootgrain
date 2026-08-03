"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LoginSchema } from "@/validations/auth.schema";
import { useAuth } from "@/components/auth/Providers";
import { FeatureFlags } from "@/lib/flags";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/auth/PasswordInput";
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type LoginValues = z.infer<typeof LoginSchema>;

export function LoginForm() {
  const router = useRouter();
  const { refreshSession } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<LoginValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginValues) => {
    setIsLoading(true);
    setServerError(null);

    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Signed in successfully");
        await refreshSession();
        router.push("/account");
        router.refresh();
      } else {
        setServerError(data.error?.message || "Invalid email or password");
      }
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      // Redirect to server-side Google OAuth initiation endpoint
      window.location.href = "/api/v1/auth/google";
    } catch {
      toast.error("Could not connect to Google");
      setIsGoogleLoading(false);
    }
  };

  const googleEnabled = FeatureFlags.ENABLE_GOOGLE_AUTH;

  return (
    <Card className="w-full max-w-md mx-auto border-[var(--walnut)]/20 shadow-xl">
      <CardHeader className="space-y-2 text-center pb-6">
        <CardTitle className="text-3xl font-serif text-[var(--walnut)]">Welcome Back</CardTitle>
        <CardDescription className="text-[var(--walnut-light)] text-base">
          Sign in to your account to continue
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[var(--walnut)]">Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="you@example.com"
                      type="email"
                      autoComplete="email"
                      className="border-[var(--walnut)]/30 focus-visible:ring-[var(--gold)]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-[var(--walnut)]">Password</FormLabel>
                    <Link href="/forgot-password" className="text-sm text-[var(--gold)] hover:underline" tabIndex={-1}>
                      Forgot password?
                    </Link>
                  </div>
                  <FormControl>
                    <PasswordInput
                      autoComplete="current-password"
                      className="border-[var(--walnut)]/30 focus-visible:ring-[var(--gold)]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {serverError && (
              <p className="text-sm text-destructive text-center" role="alert">{serverError}</p>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[var(--walnut)] hover:bg-[var(--walnut-light)] text-white"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isLoading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </Form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--walnut)]/20" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-[var(--walnut-light)]">Or continue with</span>
          </div>
        </div>

        <div className="grid gap-4">
          <Button
            variant="outline"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading || !googleEnabled}
            className="w-full border-[var(--walnut)]/30 hover:bg-[var(--ivory)] text-[var(--walnut)]"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {isGoogleLoading ? "Connecting…" : !googleEnabled ? "Google Sign-In unavailable" : "Google"}
          </Button>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center border-t border-[var(--walnut)]/10 pt-6">
        <p className="text-sm text-[var(--walnut-light)]">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-[var(--gold)] font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
