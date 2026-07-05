"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface ShippingRate {
  id: string;
  district: string;
  baseRate: number;
  perItemRate: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart } = useCartStore();
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [address, setAddress] = useState({ name: "", phone: "", street: "" });
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  
  useEffect(() => {
    fetch("/api/shipping")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setShippingRates(data);
      })
      .catch(() => toast.error("Failed to load shipping rates"));
  }, []);

  const subtotal = items.reduce((acc: any, item: any) => acc + item.price * item.quantity, 0);
  const totalQuantity = items.reduce((acc: any, item: any) => acc + item.quantity, 0);

  let shippingCost = 0;
  if (selectedDistrict) {
    const rate = shippingRates.find(r => r.district === selectedDistrict);
    if (rate) {
      shippingCost = rate.baseRate;
      if (totalQuantity > 1) {
        shippingCost += (totalQuantity - 1) * rate.perItemRate;
      }
    }
  }

  const applyPromoCode = async () => {
    if (!promoInput) return;
    setIsApplyingPromo(true);
    try {
      const res = await fetch("/api/checkout/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoInput, subtotal })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAppliedPromo(data);
        toast.success("Promo code applied!");
      } else {
        setAppliedPromo(null);
        toast.error(data.error || "Invalid promo code");
      }
    } catch (error) {
      toast.error("Failed to apply promo code");
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
    setPromoInput("");
  };

  const discountAmount = appliedPromo?.discountAmount || 0;
  const total = subtotal + shippingCost - discountAmount;
  const advanceRequired = total * 0.2; // 20% advance

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDistrict) {
      toast.error("Please select a district");
      return;
    }
    if (!address.name || !address.phone || !address.street) {
      toast.error("Please fill all address fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          district: selectedDistrict,
          address,
          promoCode: appliedPromo?.code
        })
      });

      const data = await res.json();
      if (res.ok) {
        clearCart();
        toast.success("Order booked successfully!");
        router.push(`/checkout/success?orderNumber=${data.orderNumber}`);
      } else {
        toast.error(data.error || "Failed to book order");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-3xl font-serif text-[var(--walnut-dark)] mb-4">Your Cart is Empty</h1>
        <p className="text-muted-foreground mb-8">Add some beautiful furniture to checkout.</p>
        <Button asChild className="bg-[var(--walnut-dark)] hover:bg-[var(--gold)] text-[var(--ivory)]">
          <Link href="/shop">Go to Shop</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl md:text-4xl font-serif text-[var(--walnut-dark)] mb-8">Checkout</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h2 className="text-xl font-medium mb-4">Delivery Address</h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    value={address.name} 
                    onChange={e => setAddress({...address, name: e.target.value})} 
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    value={address.phone} 
                    onChange={e => setAddress({...address, phone: e.target.value})} 
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="district">District</Label>
                  <Select value={selectedDistrict} onValueChange={setSelectedDistrict} required>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a district" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64 overflow-y-auto">
                      {shippingRates.map(rate => (
                        <SelectItem key={rate.id} value={rate.district}>{rate.district}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!selectedDistrict && (
                    <p className="text-xs text-muted-foreground mt-1">Select a district to calculate shipping</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="street">Detailed Address (Street, House, Area)</Label>
                  <Input 
                    id="street" 
                    value={address.street} 
                    onChange={e => setAddress({...address, street: e.target.value})} 
                    required 
                  />
                </div>
              </div>
            </div>

            <div className="bg-[#fff9f2] p-6 rounded-lg border border-[var(--gold)]/30">
              <h3 className="text-lg font-medium text-[var(--walnut-dark)] mb-2">Important Notice</h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                You are required to pay a <strong>20% advance</strong> of the total bill. 
                After placing the order by clicking the <strong>"Book Order"</strong> button below, our representative 
                will call you with instructions for the advance payment. Your order will be confirmed upon receiving the advance payment.
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-[var(--walnut-dark)] hover:bg-[var(--gold)] text-[var(--ivory)] py-6 text-lg"
              disabled={isSubmitting || !selectedDistrict}
            >
              {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
              Book Order
            </Button>
          </form>
        </div>

        <div className="lg:col-span-5">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 sticky top-24">
            <h2 className="text-xl font-medium mb-6">Order Summary</h2>
            
            <div className="space-y-4 mb-6">
              {items.map((item: any) => (
                <div key={item.id} className="flex gap-4">
                  <div className="relative w-16 h-16 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1 flex justify-between">
                    <div>
                      <h4 className="font-medium text-sm text-[var(--walnut-dark)]">{item.name}</h4>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium text-sm">৳{((item.price * item.quantity) / 100).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 py-4 border-t border-gray-100">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal ({totalQuantity} items)</span>
                <span className="font-medium">৳{(subtotal / 100).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping Estimate</span>
                <span className="font-medium">
                  {shippingCost > 0 ? `৳${(shippingCost / 100).toLocaleString()}` : 'Select District'}
                </span>
              </div>
              
              {/* Promo Code Section */}
              <div className="pt-2">
                {!appliedPromo ? (
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Promo Code" 
                      value={promoInput} 
                      onChange={e => setPromoInput(e.target.value.toUpperCase())}
                      className="h-9 text-sm"
                    />
                    <Button 
                      type="button" 
                      variant="secondary" 
                      className="h-9 px-3" 
                      onClick={applyPromoCode}
                      disabled={isApplyingPromo || !promoInput}
                    >
                      {isApplyingPromo ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-green-50 text-green-700 p-2 rounded text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{appliedPromo.code}</span>
                      <span className="opacity-80">
                        (-৳{(appliedPromo.discountAmount / 100).toLocaleString()})
                      </span>
                    </div>
                    <button type="button" onClick={removePromoCode} className="text-green-900 hover:underline text-xs">
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <div className="flex justify-between items-end mb-2">
                <span className="font-medium text-gray-900">Total</span>
                <span className="text-xl font-bold text-[var(--walnut-dark)]">
                  ৳{(total / 100).toLocaleString()}
                </span>
              </div>
              
              <div className="flex justify-between items-end mt-4 p-3 bg-red-50 text-red-900 rounded-md">
                <span className="font-medium text-sm">Advance Required (20%)</span>
                <span className="font-bold text-lg">
                  ৳{(advanceRequired / 100).toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-right">Remaining amount is Cash on Delivery</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
