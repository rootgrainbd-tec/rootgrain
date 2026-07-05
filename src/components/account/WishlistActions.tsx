"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export function WishlistActions({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to remove this from your wishlist?")) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/user/wishlist/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to remove item");

      toast.success("Item removed from wishlist");
      router.refresh();
    } catch (error) {
      toast.error("Failed to remove item");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    toast.success("Added to cart! (Placeholder)");
    // TODO: Connect to actual cart state/context
  };

  return (
    <div className="flex items-center space-x-2">
      <Button variant="outline" size="sm" className="hidden sm:flex" onClick={handleAddToCart}>
        Add to Cart
      </Button>
      <Button 
        variant="ghost" 
        size="icon" 
        className="text-red-500 hover:text-red-700 hover:bg-red-50"
        onClick={handleDelete}
        disabled={loading}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}
