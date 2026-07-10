"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ShoppingBag, Minus, Plus, Trash2 } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { formatPrice } from "@/types/product";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface CartSheetProps {
  isScrolled: boolean;
}

export function CartSheet({ isScrolled }: CartSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = items.reduce((total, item) => total + (item.price * item.quantity), 0);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button aria-label="Shopping Cart" className={`relative hover:text-[var(--gold)] transition-colors ${isScrolled ? "text-[var(--walnut)]" : "text-[var(--ivory)]"}`}>
          <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />
          {mounted && totalItems > 0 && (
            <span className={`absolute -top-2 -right-2 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center ${isScrolled ? 'bg-[var(--walnut)] text-[var(--ivory)]' : 'bg-[var(--ivory)] text-[var(--walnut-dark)]'}`}>
              {totalItems}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md bg-[var(--ivory)] flex flex-col h-full border-l border-[var(--walnut-light)]/20">
        <SheetHeader className="px-1 border-b border-[var(--walnut-light)]/20 pb-4">
          <SheetTitle className="font-serif text-2xl text-[var(--walnut-dark)] font-light">Your Cart</SheetTitle>
        </SheetHeader>
        
        {!mounted ? null : items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <ShoppingBag className="w-12 h-12 text-[var(--walnut-light)]/50 mb-4" />
            <p className="text-[var(--walnut)] text-lg mb-2">Your cart is empty.</p>
            <p className="text-[var(--walnut-light)] text-sm mb-6">Looks like you haven't added anything yet.</p>
            <Button onClick={() => setIsOpen(false)} className="bg-[var(--walnut-dark)] hover:bg-[var(--gold)] text-[var(--ivory)] rounded-none px-8">
              Continue Shopping
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto py-6 space-y-6">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="w-20 h-24 bg-gray-100 shrink-0 relative border border-[var(--walnut-light)]/10">
                    <Image 
                      src={item.image} 
                      alt={item.name} 
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-[var(--walnut-dark)] font-medium text-sm pr-4 leading-tight">{item.name}</h4>
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="text-[var(--walnut-light)] hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-[var(--primary)] font-medium text-sm mb-4">{formatPrice(item.price)}</p>
                    
                    <div className="flex items-center gap-3 mt-auto">
                      <div className="flex items-center border border-[var(--walnut-light)]/30">
                        <button 
                          className="px-2 py-1 text-[var(--walnut)] hover:bg-[var(--parchment)] disabled:opacity-50"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium text-[var(--walnut-dark)]">
                          {item.quantity}
                        </span>
                        <button 
                          className="px-2 py-1 text-[var(--walnut)] hover:bg-[var(--parchment)]"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-[var(--walnut-light)]/20 pt-6 pb-2 px-1">
              <div className="flex justify-between items-center mb-6">
                <span className="text-[var(--walnut)] uppercase text-sm tracking-widest font-medium">Subtotal</span>
                <span className="text-[var(--walnut-dark)] font-sans text-xl font-medium tracking-tight">
                  {formatPrice(totalPrice)}
                </span>
              </div>
              <p className="text-xs text-[var(--walnut-light)] mb-6">
                Shipping & taxes calculated at checkout.
              </p>
              <Button asChild className="w-full bg-[var(--walnut-dark)] hover:bg-[var(--gold)] text-[var(--ivory)] py-7 text-sm tracking-widest uppercase transition-colors rounded-none">
                <Link href="/checkout" onClick={() => setIsOpen(false)}>
                  Proceed to Checkout
                </Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
