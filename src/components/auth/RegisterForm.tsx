"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export function RegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (res.ok) {
        toast.success("Account created successfully. Please login.");
        router.push("/login");
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to create account");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto border-[var(--walnut)]/20 shadow-xl">
      <CardHeader className="space-y-2 text-center pb-6">
        <CardTitle className="text-3xl font-serif text-[var(--walnut)]">Create Account</CardTitle>
        <CardDescription className="text-[var(--walnut-light)] text-base">
          Join Rootgrain to track orders and save your favorites
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-[var(--walnut)]">Full Name</Label>
            <Input 
              id="name" 
              type="text" 
              placeholder="John Doe" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="border-[var(--walnut)]/30 focus-visible:ring-[var(--gold)]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[var(--walnut)]">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="you@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border-[var(--walnut)]/30 focus-visible:ring-[var(--gold)]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-[var(--walnut)]">Password</Label>
            <Input 
              id="password" 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="border-[var(--walnut)]/30 focus-visible:ring-[var(--gold)]"
            />
          </div>
          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-[var(--walnut)] hover:bg-[var(--walnut-light)] text-white"
          >
            {isLoading ? "Creating account..." : "Sign up"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center border-t border-[var(--walnut)]/10 pt-6">
        <p className="text-sm text-[var(--walnut-light)]">
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--gold)] font-medium hover:underline">
            Log in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
