"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function PasswordChangeForm() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to change password");
      }

      toast.success("Password changed successfully!");
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to change password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="currentPassword" className="text-[var(--walnut)]">Current Password</Label>
        <Input 
          id="currentPassword" 
          type="password"
          value={formData.currentPassword} 
          onChange={handleChange}
          className="border-[var(--walnut)]/30 focus-visible:ring-[var(--gold)]"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="newPassword" className="text-[var(--walnut)]">New Password</Label>
        <Input 
          id="newPassword" 
          type="password"
          value={formData.newPassword} 
          onChange={handleChange}
          className="border-[var(--walnut)]/30 focus-visible:ring-[var(--gold)]"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-[var(--walnut)]">Confirm New Password</Label>
        <Input 
          id="confirmPassword" 
          type="password"
          value={formData.confirmPassword} 
          onChange={handleChange}
          className="border-[var(--walnut)]/30 focus-visible:ring-[var(--gold)]"
          required
        />
      </div>
      <div className="pt-4">
        <Button type="submit" disabled={loading} className="bg-[var(--walnut)] hover:bg-[var(--walnut-light)] text-white">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          {loading ? "Updating..." : "Change Password"}
        </Button>
      </div>
    </form>
  );
}
