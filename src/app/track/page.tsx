"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, CheckCircle2, Package, Truck, Home } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber) {
      toast.error("Please enter an Order Number");
      return;
    }

    setIsLoading(true);
    setOrder(null);
    try {
      const res = await fetch(`/api/track?orderNumber=${encodeURIComponent(orderNumber)}`);
      const data = await res.json();
      
      if (res.ok && data.success) {
        setOrder(data.order);
      } else {
        toast.error(data.error || "Order not found. Please check your details.");
      }
    } catch (error) {
      toast.error("Failed to track order");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIndex = (status: string) => {
    switch(status) {
      case "PENDING_ADVANCE": return 0;
      case "CONFIRMED": return 1;
      case "DISPATCHED": return 2;
      case "DELIVERED": return 3;
      default: return 0;
    }
  };

  const currentStep = order ? getStatusIndex(order.status) : 0;
  
  const steps = [
    { title: "Order Placed", description: "Pending Advance", icon: CheckCircle2 },
    { title: "Confirmed", description: "In Production", icon: Package },
    { title: "Dispatched", description: "On the way", icon: Truck },
    { title: "Delivered", description: "Completed", icon: Home },
  ];

  return (
    <div className="min-h-[70vh] bg-[#fcfaf8] py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-serif text-[var(--walnut-dark)] mb-4">Track Your Order</h1>
          <p className="text-gray-600">Enter your order number below to see the current status of your furniture.</p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
          <form onSubmit={handleTrack} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1 text-gray-700">Order Number</label>
              <Input 
                placeholder="e.g. RG-20260710-123456" 
                value={orderNumber}
                onChange={e => setOrderNumber(e.target.value)}
                className="h-12"
                required
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={isLoading} className="h-12 px-8 bg-[var(--walnut-dark)] hover:bg-[var(--gold)] text-white w-full md:w-auto">
                {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <><Search className="w-4 h-4 mr-2" /> Track</>}
              </Button>
            </div>
          </form>

          {order && (
            <div className="mt-12 pt-12 border-t border-gray-100">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-xl font-bold text-[var(--walnut-dark)]">Order #{order.orderNumber}</h3>
                  <p className="text-sm text-gray-500">Placed on {format(new Date(order.createdAt), "MMMM d, yyyy")}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">Total: ৳{order.total.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">{order.items.length} items</p>
                </div>
              </div>

              {order.status === "CANCELLED" || order.status === "REJECTED" ? (
                <div className="bg-red-50 text-red-700 p-6 rounded-lg text-center font-medium">
                  This order has been {order.status.toLowerCase()}.
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-1 bg-gray-200 -translate-x-1/2 hidden md:block"></div>
                  
                  <div className="space-y-8 relative">
                    {steps.map((step, index) => {
                      const Icon = step.icon;
                      const isActive = index <= currentStep;
                      const isCurrent = index === currentStep;
                      
                      return (
                        <div key={index} className="flex flex-col md:flex-row items-center md:justify-between relative z-10">
                          <div className={`hidden md:block w-5/12 text-right pr-8 ${isActive ? 'text-[var(--walnut-dark)]' : 'text-gray-400'}`}>
                            {isCurrent && <span className="font-bold text-sm bg-[var(--gold)]/10 text-[var(--gold)] px-2 py-1 rounded">CURRENT STATUS</span>}
                          </div>
                          
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-4 border-white shadow-sm ${isActive ? 'bg-[var(--gold)] text-white' : 'bg-gray-200 text-gray-400'}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          
                          <div className={`md:w-5/12 md:pl-8 text-center md:text-left mt-4 md:mt-0 ${isActive ? 'text-[var(--walnut-dark)]' : 'text-gray-400'}`}>
                            <h4 className="font-bold">{step.title}</h4>
                            <p className="text-sm opacity-80">{step.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
