"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ForgotPasswordSchema } from "@/validations/auth.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";

type ForgotPasswordValues = z.infer<typeof ForgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: ForgotPasswordValues) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setIsSuccess(true);
        toast.success(data.message || "If an account exists, an email will be sent.");
      } else {
        // Still show generic message for enumeration protection
        setIsSuccess(true);
        toast.success("If an account exists, an email will be sent.");
      }
    } catch {
      toast.error("Failed to send reset email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] bg-[#fcfaf8] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="mt-6 text-center text-3xl font-serif text-[var(--walnut-dark)]">
          Reset your password
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          {isSuccess ? (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <Mail className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="text-lg font-medium text-gray-900 mb-2">Check your email</h2>
              <p className="text-sm text-gray-600 mb-6">
                If an account exists with that email, we&apos;ve sent password reset instructions.
              </p>
              <Button asChild className="w-full bg-[var(--walnut-dark)] hover:bg-[var(--gold)] text-white">
                <Link href="/login">Return to login</Link>
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          autoComplete="email"
                          placeholder="you@example.com"
                          className="h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-[var(--walnut-dark)] hover:bg-[var(--gold)] text-white transition-colors"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Send reset link"
                  )}
                </Button>

                <div className="text-center mt-4">
                  <Link href="/login" className="inline-flex items-center text-sm text-[var(--walnut-dark)] hover:text-[var(--gold)] transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to login
                  </Link>
                </div>
              </form>
            </Form>
          )}
        </div>
      </div>
    </div>
  );
}
