"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingBag, Minus, Plus } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { toast } from "sonner";
import { InquiryDialog } from "./InquiryDialog";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/types/product";
import { useSession } from "next-auth/react";

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
  baseLeadTimeDays?: number;
  additionalUnitLeadTimeDays?: number;
}

export function ProductActions({ product, whatsappNumber, baseLeadTimeDays, additionalUnitLeadTimeDays }: ProductActionsProps) {
  const { data: session } = useSession();
  const [addingToWishlist, setAddingToWishlist] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isWishlistLoaded, setIsWishlistLoaded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isNavigating, setIsNavigating] = useState(false);
  
  const addItem = useCartStore((state) => state.addItem);
  const router = useRouter();

  useEffect(() => {
    if (session?.user) {
      fetch("/api/user/wishlist")
        .then((res) => res.json())
        .then((data) => {
          if (data.data?.wishlistItems) {
            const exists = data.data.wishlistItems.some((item: any) => item.productId === product.id);
            setIsWishlisted(exists);
          }
          setIsWishlistLoaded(true);
        })
        .catch((err) => {
          console.error("Failed to load wishlist", err);
          setIsWishlistLoaded(true);
        });
    } else {
      setIsWishlistLoaded(true);
    }
  }, [session, product.id]);

  // Safe lead-time fallbacks consistent with Phase 6 convention
  const safeBaseLead = (typeof baseLeadTimeDays === "number" && Number.isInteger(baseLeadTimeDays) && baseLeadTimeDays > 0) ? baseLeadTimeDays : 30;
  const safeAddLead = (typeof additionalUnitLeadTimeDays === "number" && Number.isInteger(additionalUnitLeadTimeDays) && additionalUnitLeadTimeDays > 0) ? additionalUnitLeadTimeDays : 10;

  // Derived display values (NOT authoritative — server recalculates)
  const estimatedTotal = product.price * quantity;
  const estimatedLeadTime = safeBaseLead + ((quantity - 1) * safeAddLead);

  const handleDecrement = () => setQuantity((prev) => Math.max(1, prev - 1));
  const handleIncrement = () => setQuantity((prev) => prev + 1);

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

  const handleBuy = () => {
    if (isNavigating) return;
    if (product.isMto) {
      const safeQty = Math.max(1, Math.floor(quantity));
      if (!Number.isFinite(safeQty)) return;
      setIsNavigating(true);
      router.push(`/checkout/mto?productId=${product.id}&qty=${safeQty}`);
    } else {
      handleAddToCart();
      setIsNavigating(true);
      router.push('/checkout');
    }
  };

  const handleStandardBuy = () => {
    if (isNavigating) return;
    handleAddToCart();
    setIsNavigating(true);
    router.push('/checkout');
  };

  const handleAddToWishlist = async () => {
    if (!session?.user) {
      toast.error("Please login to update wishlist.");
      return;
    }

    // Optimistic update
    const previousState = isWishlisted;
    setIsWishlisted(!previousState);
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
        setIsWishlisted(previousState);
        if (res.status === 401) {
          toast.error("Please login to update wishlist.");
        } else {
          throw new Error("Failed to update wishlist (Status: " + res.status + ")");
        }
        return;
      }

      const resData = await res.json();
      if (resData.data?.action === 'removed') {
        setIsWishlisted(false);
        toast.success("Removed from wishlist");
      } else {
        setIsWishlisted(true);
        toast.success("Added to wishlist!");
      }
    } catch (error) {
      setIsWishlisted(previousState);
      toast.error("Failed to update wishlist.");
    } finally {
      setAddingToWishlist(false);
    }
  };

  const renderPrimaryActions = () => {
    if (product.isMto) {
      return (
        <Button
          onClick={handleBuy}
          disabled={isNavigating}
          aria-label={"Buy " + product.name + ", quantity " + quantity}
          className="w-full bg-[var(--gold)] hover:bg-[var(--walnut-dark)] text-[var(--ivory)] py-8 text-sm tracking-widest uppercase transition-colors rounded-none"
        >
          {isNavigating ? "Processing…" : "BUY"}
        </Button>
      );
    }
    
    if (product.isAvailable) {
      return (
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleStandardBuy}
            disabled={isNavigating}
            className="flex-1 bg-[var(--gold)] hover:bg-[var(--walnut-dark)] text-[var(--ivory)] py-8 text-sm tracking-widest uppercase transition-colors rounded-none"
          >
            {isNavigating ? "Processing…" : "BUY"}
          </Button>
          <Button 
            onClick={handleAddToCart}
            className="flex-1 bg-[var(--walnut-dark)] hover:bg-[var(--gold)] text-[var(--ivory)] py-8 text-sm tracking-widest uppercase transition-colors rounded-none"
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            Add to Cart
          </Button>
        </div>
      );
    }

    return null; // Unavailable/Sold -> No primary commerce actions
  };

  return (
    <div className="space-y-5 mt-6">
      {/* Only show MTO selectors if MTO */}
      {product.isMto && (
        <>
          {/* Quantity Selector */}
          <div>
            <span className="block text-xs tracking-wider uppercase text-[var(--walnut-light)] mb-2">
              Quantity
            </span>
            <div className="flex items-center gap-0 w-fit">
              <button
                type="button"
                onClick={handleDecrement}
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
                className="w-11 h-11 flex items-center justify-center border border-[var(--walnut-light)]/30 text-[var(--walnut-dark)] hover:bg-[var(--parchment)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span
                className="w-14 h-11 flex items-center justify-center border-y border-[var(--walnut-light)]/30 text-base font-medium text-[var(--walnut-dark)] select-none"
                aria-live="polite"
                aria-label={"Quantity: " + quantity}
              >
                {quantity}
              </span>
              <button
                type="button"
                onClick={handleIncrement}
                aria-label="Increase quantity"
                className="w-11 h-11 flex items-center justify-center border border-[var(--walnut-light)]/30 text-[var(--walnut-dark)] hover:bg-[var(--parchment)] transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Estimated Total + Lead Time */}
          <div className="space-y-2">
            <div>
              <span className="block text-xs tracking-wider uppercase text-[var(--walnut-light)] mb-1">
                Estimated total
              </span>
              <span className="font-sans font-medium text-xl text-[var(--walnut-dark)] tracking-tight">
                {formatPrice(estimatedTotal)}
              </span>
            </div>
            <div>
              <span className="block text-xs tracking-wider uppercase text-[var(--walnut-light)] mb-1">
                Estimated lead time
              </span>
              <span className="text-[var(--walnut-dark)]">
                {estimatedLeadTime} days
              </span>
            </div>
          </div>
        </>
      )}

      {/* Primary & Secondary Actions Container */}
      <div className="flex flex-col gap-3">
        {renderPrimaryActions()}
        
        {/* Secondary Row: INQUIRE + WISHLIST */}
        <div className="flex gap-3 items-stretch">
          <div className="flex-1">
            <InquiryDialog product={product} whatsappNumber={whatsappNumber} triggerText="INQUIRE" />
          </div>
          <Button 
            onClick={handleAddToWishlist}
            disabled={addingToWishlist || (!isWishlistLoaded && !!session?.user)}
            variant="outline"
            aria-pressed={isWishlisted}
            aria-label={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
            className="flex-1 h-auto border-[var(--walnut-light)] text-[var(--walnut-dark)] hover:border-[var(--gold)] hover:text-[var(--gold)] py-8 px-4 rounded-none transition-colors flex items-center justify-center gap-2"
          >
            <Heart 
              className={"w-5 h-5 " + (addingToWishlist ? 'animate-pulse' : '') + " " + (isWishlisted ? 'fill-[var(--walnut-dark)]' : '')} 
            />
            <span className="text-sm tracking-widest uppercase">WISHLIST</span>
          </Button>
        </div>
      </div>

      {/* Social Sharing */}
      <div className="flex items-center gap-3 pt-4 border-t border-[var(--walnut-light)]/20">
        <span className="text-sm text-[var(--walnut-light)]">Share:</span>
        <a 
          href={"https://wa.me/?text=" + encodeURIComponent("Check out " + product.name + " on RootGrain: https://rootgrain.com/product/" + product.id)}
          target="_blank"
          rel="noopener noreferrer"
          className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center hover:opacity-80 transition-opacity"
          title="Share on WhatsApp"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        </a>
        <a 
          href={"https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent("https://rootgrain.com/product/" + product.id)}
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
