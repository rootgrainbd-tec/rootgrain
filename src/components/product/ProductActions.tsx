"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { toast } from "sonner";

interface ProductActionsProps {
  product: {
    id: string; // Sanity ID
    name: string;
    price: number;
    image: string;
    isAvailable: boolean;
  };
}

export function ProductActions({ product }: ProductActionsProps) {
  const [addingToWishlist, setAddingToWishlist] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = () => {
    if (!product.isAvailable) {
      toast.error("This product is currently unavailable.");
      return;
    }

    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1,
    });
    
    toast.success("Added to cart!");
    // We can emit an event or just rely on Zustand to update the Cart Sheet
  };

  const handleAddToWishlist = async () => {
    setAddingToWishlist(true);
    try {
      const res = await fetch("/api/user/wishlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId: product.id }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Please login to add to wishlist.");
        } else {
          throw new Error("Failed to add to wishlist");
        }
        return;
      }

      toast.success("Added to wishlist!");
    } catch (error) {
      toast.error("Failed to add to wishlist.");
    } finally {
      setAddingToWishlist(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 mt-6">
      <Button 
        onClick={handleAddToCart}
        disabled={!product.isAvailable}
        className="flex-1 bg-[var(--walnut-dark)] hover:bg-[var(--gold)] text-[var(--ivory)] py-8 text-sm tracking-widest uppercase transition-colors rounded-none"
      >
        <ShoppingBag className="w-4 h-4 mr-2" />
        {product.isAvailable ? "Add to Cart" : "Out of Stock"}
      </Button>
      <Button 
        onClick={handleAddToWishlist}
        disabled={addingToWishlist}
        variant="outline"
        className="sm:flex-none border-[var(--walnut-light)] text-[var(--walnut-dark)] hover:border-[var(--gold)] hover:text-[var(--gold)] py-8 px-8 rounded-none transition-colors"
      >
        <Heart className={`w-5 h-5 ${addingToWishlist ? 'animate-pulse' : ''}`} />
        <span className="sr-only">Add to Wishlist</span>
      </Button>
    </div>
  );
}
