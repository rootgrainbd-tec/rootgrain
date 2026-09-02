"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { bdDivisions, bdDistricts } from "@/lib/bd-locations";

interface MtoCheckoutClientProps {
  item: {
    id: string;
    name: string;
    price: number;
    image: string;
    quantity: number;
  };
  baseLeadTimeDays: number;
  additionalUnitLeadTimeDays: number;
}

export function MtoCheckoutClient({ item, baseLeadTimeDays, additionalUnitLeadTimeDays }: MtoCheckoutClientProps) {
  const router = useRouter();
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [isShippingLoading, setIsShippingLoading] = useState(true);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [address, setAddress] = useState({ name: "", email: "", phone: "", street: "", postCode: "" });
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [customerNote, setCustomerNote] = useState("");

  const items = [item];
  const subtotal = item.price * item.quantity;
  const safeBaseLead = (typeof baseLeadTimeDays === "number" && Number.isInteger(baseLeadTimeDays) && baseLeadTimeDays > 0) ? baseLeadTimeDays : 30;
  const safeAddLead = (typeof additionalUnitLeadTimeDays === "number" && Number.isInteger(additionalUnitLeadTimeDays) && additionalUnitLeadTimeDays > 0) ? additionalUnitLeadTimeDays : 10;
  const estimatedManufacturingDays = safeBaseLead + ((item.quantity - 1) * safeAddLead);

  useEffect(() => {
    setIsShippingLoading(true);
    setShippingError(null);
    fetch("/api/checkout/shipping-preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to calculate shipping");
        }
        setShippingCost(data.shippingCost);
      })
      .catch((err) => {
        setShippingError(err.message);
        toast.error(err.message);
      })
      .finally(() => {
        setIsShippingLoading(false);
      });
  }, [item]);

  useEffect(() => {
    fetch("/api/user/address")
      .then(res => {
        if (!res.ok) throw new Error("Not logged in or no addresses");
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const defaultAddress = data.find((a: any) => a.isDefault) || data[0];
          setAddress({
            name: defaultAddress.name || "",
            email: "",
            phone: defaultAddress.phone || "",
            street: defaultAddress.street || "",
            postCode: defaultAddress.postCode || "",
          });
          if (defaultAddress.division) setSelectedDivision(defaultAddress.division);
          if (defaultAddress.district) setSelectedDistrict(defaultAddress.district);
        }
      })
      .catch(() => {});
  }, []);

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
        setAppliedPromo(data.data);
        toast.success("Promo code applied!");
      } else {
        setAppliedPromo(null);
        toast.error(data.error?.message || "Invalid promo code");
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
  const advanceRequired = Math.floor(total * 0.50); // 50% advance

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDivision || !selectedDistrict) {
      toast.error("Please select both division and district");
      return;
    }
    if (shippingError) {
      toast.error(shippingError);
      return;
    }
    if (!address.name || !address.phone || !address.street) {
      toast.error("Please fill all address fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/checkout/mto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: item.id,
          quantity: item.quantity,
          division: selectedDivision,
          district: selectedDistrict,
          address,
          promoCode: appliedPromo?.code,
          customerNote: customerNote || undefined,
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("MTO Order booked successfully!");
        router.push(`/checkout/success?orderNumber=${data.data.orderNumber}`);
      } else {
        toast.error(data.error?.message || data.message || "Failed to book MTO order");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl md:text-4xl font-serif text-[var(--walnut-dark)] mb-8">Made-to-Order Checkout</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h2 className="text-xl font-medium mb-4">Delivery Address</h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={address.name} onChange={e => setAddress({...address, name: e.target.value})} required />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" value={address.email} onChange={e => setAddress({...address, email: e.target.value})} required />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" value={address.phone} onChange={e => setAddress({...address, phone: e.target.value})} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="division">Division</Label>
                    <Select value={selectedDivision} onValueChange={(val) => { setSelectedDivision(val); setSelectedDistrict(""); }} required>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Division" />
                      </SelectTrigger>
                      <SelectContent className="max-h-64">
                        {bdDivisions.map(div => (
                          <SelectItem key={div} value={div}>{div}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="district">District</Label>
                    <Select value={selectedDistrict} onValueChange={setSelectedDistrict} required disabled={!selectedDivision}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select District" />
                      </SelectTrigger>
                      <SelectContent className="max-h-64 overflow-y-auto">
                        {selectedDivision && bdDistricts[selectedDivision]?.map(dist => (
                            <SelectItem key={dist} value={dist}>{dist}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="street">Detailed Address (Street, House, Area)</Label>
                  <Input id="street" value={address.street} onChange={e => setAddress({...address, street: e.target.value})} required />
                </div>
                <div>
                  <Label htmlFor="postCode">Post Code (Optional)</Label>
                  <Input id="postCode" value={address.postCode} onChange={e => setAddress({...address, postCode: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h2 className="text-xl font-medium mb-4">Customer Note (Optional)</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="customerNote">Any specific instructions or preferences for your Made-to-Order product?</Label>
                  <Textarea 
                    id="customerNote" 
                    value={customerNote} 
                    onChange={e => setCustomerNote(e.target.value)}
                    placeholder="Enter your notes here..."
                    className="min-h-[100px]"
                  />
                  <p className="text-xs text-gray-500 mt-2">Notes are finalized upon order creation and cannot be changed.</p>
                </div>
              </div>
            </div>

            <div className="bg-[#fff9f2] p-6 rounded-lg border border-[var(--gold)]/30">
              <h3 className="text-lg font-medium text-[var(--walnut-dark)] mb-2">Made-to-Order Advance Required</h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                Made-to-Order products require a <strong>50% advance</strong> payment of the total bill to begin production. 
                After placing the order by clicking the <strong>"Book MTO Order"</strong> button below, our representative 
                will contact you with instructions for the advance payment.
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-[var(--gold)] hover:bg-[var(--walnut-dark)] text-[var(--ivory)] py-6 text-lg tracking-wider"
              disabled={isSubmitting || !!shippingError || isShippingLoading}
            >
              {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
              BOOK MTO ORDER
            </Button>
          </form>
        </div>

        <div className="lg:col-span-5">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 sticky top-24">
            <h2 className="text-xl font-medium mb-6">MTO Order Summary</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex gap-4">
                <div className="relative w-16 h-16 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                  <Image src={item.image} alt={item.name} fill className="object-cover" />
                </div>
                <div className="flex-1 flex justify-between">
                  <div>
                    <h4 className="font-medium text-sm text-[var(--walnut-dark)]">{item.name}</h4>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    <p className="text-xs text-[var(--gold)] mt-1">Lead Time: ~{estimatedManufacturingDays} Days</p>
                  </div>
                  <p className="font-medium text-sm">৳{(item.price * item.quantity).toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 py-4 border-t border-gray-100">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal (1 item)</span>
                <span className="font-medium">৳{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping Estimate</span>
                <span className="font-medium">
                  {isShippingLoading ? 'Calculating...' : shippingError ? 'Not Available' : `৳${shippingCost.toLocaleString()}`}
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
                      <span className="opacity-80">(-৳{appliedPromo.discountAmount.toLocaleString()})</span>
                    </div>
                    <button type="button" onClick={removePromoCode} className="text-green-900 hover:underline text-xs">Remove</button>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <div className="flex justify-between items-end mb-2">
                <span className="font-medium text-gray-900">Total</span>
                <span className="text-xl font-bold text-[var(--walnut-dark)]">
                  ৳{total.toLocaleString()}
                </span>
              </div>
              
              <div className="flex justify-between items-end mt-4 p-3 bg-red-50 text-red-900 rounded-md border border-red-200">
                <span className="font-medium text-sm">Advance Required (50%)</span>
                <span className="font-bold text-lg text-red-700">
                  ৳{advanceRequired.toLocaleString()}
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
