"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface ProfileFormProps {
  user: {
    name: string | null;
    email: string | null;
    phone: string | null;
  };
}

export function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || "",
    phone: user.phone || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to update profile");

      toast.success("Profile updated successfully!");
      router.refresh();
    } catch (error) {
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-[var(--walnut)]">Full Name</Label>
        <Input 
          id="name" 
          value={formData.name} 
          onChange={handleChange}
          className="border-[var(--walnut)]/30 focus-visible:ring-[var(--gold)]"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email" className="text-[var(--walnut)]">Email Address</Label>
        <Input 
          id="email" 
          value={user.email || ""} 
          disabled 
          className="bg-gray-50 border-[var(--walnut)]/30"
        />
        <p className="text-xs text-gray-500">Email cannot be changed. Contact support if needed.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone" className="text-[var(--walnut)]">Phone Number</Label>
        <Input 
          id="phone" 
          value={formData.phone} 
          onChange={handleChange}
          placeholder="+880 1..."
          className="border-[var(--walnut)]/30 focus-visible:ring-[var(--gold)]"
        />
      </div>
      <div className="pt-4">
        <Button type="submit" disabled={loading} className="bg-[var(--walnut)] hover:bg-[var(--walnut-light)] text-white">
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
