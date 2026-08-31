"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingBag, Zap } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { toast } from "sonner";
import { InquiryDialog } from "./InquiryDialog";
import { useRouter } from "next/navigation";

interface ProductActionsProps {
  product: {
    id: string; // Product slug (matches Prisma Product.id)
    name: string;
    price: number;
    image: string;
    isAvailable: boolean;
    isMto?: boolean;
  };
  whatsappNumber: string;
}

export function ProductActions({ product, whatsappNumber }: ProductActionsProps) {
  const [addingToWishlist, setAddingToWishlist] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const router = useRouter();

  const handleAddToCart = () => {
    if (product.isMto) {
      toast.error("Made to Order products cannot be added to the normal cart.");
      return;
    }
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
  };

  const handleDirectBuy = () => {
    router.push(`/checkout/mto?productId=${product.id}&qty=1`);
  };

  const handleAddToWishlist = async () => {
    setAddingToWishlist(true);
    console.log(`\n[FRONTEND] Request started for productId:`, product.id);
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
          toast.error("Please login to update wishlist.");
        } else {
          throw new Error(`Failed to update wishlist (Status: ${res.status})`);
        }
        return;
      }

      const resData = await res.json();
      if (resData.data?.action === 'removed') {
        toast.success("Removed from wishlist");
      } else {
        toast.success("Added to wishlist!");
      }
    } catch (error) {
      toast.error("Failed to update wishlist.");
    } finally {
      setAddingToWishlist(false);
    }
  };

  return (
    <div className="space-y-4 mt-6">
      <div className="flex flex-col sm:flex-row gap-4">
        {product.isMto ? (
          <Button 
            onClick={handleDirectBuy}
            className="flex-1 bg-[var(--gold)] hover:bg-[var(--walnut-dark)] text-[var(--ivory)] py-8 text-sm tracking-widest uppercase transition-colors rounded-none"
          >
            <Zap className="w-4 h-4 mr-2" />
            DIRECT BUY
          </Button>
        ) : product.isAvailable ? (
          <Button 
            onClick={handleAddToCart}
            className="flex-1 bg-[var(--walnut-dark)] hover:bg-[var(--gold)] text-[var(--ivory)] py-8 text-sm tracking-widest uppercase transition-colors rounded-none"
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            Add to Cart
          </Button>
        ) : (
          <InquiryDialog product={product} whatsappNumber={whatsappNumber} />
        )}
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
      
      {/* Social Sharing */}
      <div className="flex items-center gap-3 pt-4 border-t border-[var(--walnut-light)]/20">
        <span className="text-sm text-[var(--walnut-light)]">Share:</span>
        <a 
          href={`https://wa.me/?text=${encodeURIComponent(`Check out ${product.name} on RootGrain: https://rootgrain.com/product/${product.id}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center hover:opacity-80 transition-opacity"
          title="Share on WhatsApp"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        </a>
        <a 
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://rootgrain.com/product/${product.id}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-8 h-8 rounded-full bg-[#1877F2] text-white flex items-center justify-center hover:opacity-80 transition-opacity"
          title="Share on Facebook"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
        </a>
      </div>
    </div>
  );
}
