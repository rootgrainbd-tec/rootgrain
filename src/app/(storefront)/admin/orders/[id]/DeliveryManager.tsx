"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, PackageCheck } from "lucide-react";
import { markOrderDeliveredAction } from "@/app/actions/admin.delivery";

export default function DeliveryManager({ order }: { order: any }) {
  const [isPending, startTransition] = useTransition();

  // Delivery Gate
  const canDeliver = order.status === "DISPATCHED";
  const hasOutstandingBalance = order.balanceDue > 0;
  
  if (order.status !== "DISPATCHED" && order.status !== "DELIVERED") {
      return null;
  }

  const handleDeliver = () => {
    if (hasOutstandingBalance) {
      if (!confirm(`Warning: This order has an outstanding balance of ৳${order.balanceDue.toLocaleString()}. Delivery is structurally permitted. Proceed to mark as delivered?`)) return;
    } else {
      if (!confirm("Are you sure you want to mark this order as delivered?")) return;
    }
    
    startTransition(async () => {
      const res = await markOrderDeliveredAction(order.id);
      if (res.success) {
        toast.success("Order marked as delivered successfully.");
      } else {
        toast.error(res.error || "Failed to mark order as delivered");
      }
    });
  };

  return (
    <div className="bg-white p-6 rounded-sm border shadow-sm">
      <div className="flex justify-between items-center border-b pb-2 mb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          Delivery Management
        </h3>
        {order.status === "DELIVERED" && (
          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold">DELIVERED</span>
        )}
      </div>

      <div className="space-y-4">
        {hasOutstandingBalance && order.status !== "DELIVERED" && (
           <div className="bg-amber-50 text-amber-800 p-3 rounded-md text-sm border border-amber-200">
             <p className="font-semibold">Outstanding Balance: ৳{order.balanceDue.toLocaleString()}</p>
             <p>This order has not been fully paid. Delivery is allowed. You can collect payment after delivery.</p>
           </div>
        )}
        
        {hasOutstandingBalance && order.status === "DELIVERED" && (
           <div className="bg-amber-50 text-amber-800 p-3 rounded-md text-sm border border-amber-200">
             <p className="font-semibold">Outstanding Balance: ৳{order.balanceDue.toLocaleString()}</p>
             <p>Order has been delivered. Please ensure remaining payment is collected.</p>
           </div>
        )}

        {canDeliver && (
          <div className="pt-2">
            <Button onClick={handleDeliver} disabled={isPending} className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2">
              {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PackageCheck className="w-4 h-4" />} 
              Mark Delivered
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
