"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function AddressDeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/user/address/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete address");

      toast.success("Address deleted successfully");
      router.refresh();
    } catch (error) {
      toast.error("Failed to delete address");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      variant="link" 
      onClick={handleDelete}
      disabled={loading}
      className="p-0 h-auto text-red-500"
    >
      {loading ? "Deleting..." : "Delete"}
    </Button>
  );
}
