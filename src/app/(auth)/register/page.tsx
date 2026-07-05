import { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Create Account | Rootgrain",
  description: "Create a new Rootgrain account to manage orders.",
};

export default function RegisterPage() {
  return (
    <div className="container relative flex pt-20 flex-col items-center justify-center min-h-[80vh]">
      <RegisterForm />
    </div>
  );
}
