import { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Login | Rootgrain",
  description: "Sign in to your Rootgrain account.",
};

export default function LoginPage() {
  return (
    <div className="container relative flex pt-20 flex-col items-center justify-center min-h-[80vh]">
      <LoginForm />
    </div>
  );
}
