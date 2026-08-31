"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Truck, Check } from "lucide-react";
import { dispatchOrderAction } from "@/app/actions/admin.mto";

export default function DispatchManager({ order }: { order: any }) {
  const [isPending, startTransition] = useTransition();
  const [showDispatchForm, setShowDispatchForm] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [notes, setNotes] = useState("");

  const finalInvoice = order.documents?.find((d: any) => d.documentType === "FINAL_INVOICE");
  const hasFinalInvoice = !!finalInvoice;
  const isBalanceZero = order.balanceDue === 0;
  
  // Production Gate
  const isProductionComplete = order.isMtoOrder 
    ? order.productionState === "COMPLETE"
    : true; // RTS bypasses production or handles it differently as per 0184-R

  // Tracking State Gate
  const isValidTrackingState = order.trackingState === "IN_PRODUCTION" || order.trackingState === "PENDING_PRODUCTION";

  // General Status Gate
  const isCancellableOrRejected = order.status === "CANCELLED" || order.status === "REJECTED";
  const isAlreadyDispatchedOrDelivered = order.status === "DISPATCHED" || order.status === "DELIVERED";

  const canDispatch = hasFinalInvoice && isBalanceZero && isProductionComplete && isValidTrackingState && !isCancellableOrRejected && !isAlreadyDispatchedOrDelivered;

  const handleDispatch = () => {
    if (!confirm("Are you sure you want to dispatch this order? This will send a notification to the customer.")) return;
    startTransition(async () => {
      const res = await dispatchOrderAction(order.id, trackingNumber, trackingUrl, notes);
      if (res.success) {
        toast.success("Order dispatched successfully.");
        setShowDispatchForm(false);
      } else {
        toast.error(res.error || "Failed to dispatch order");
      }
    });
  };

  return (
    <div className="bg-white p-6 rounded-sm border shadow-sm">
      <div className="flex justify-between items-center border-b pb-2 mb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          Dispatch Management
        </h3>
        {order.status === "DISPATCHED" && (
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-bold">DISPATCHED</span>
        )}
        {order.status === "DELIVERED" && (
          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold">DELIVERED</span>
        )}
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500 font-medium mb-1">Dispatch Prerequisites</p>
            <ul className="space-y-1">
              <li className="flex items-center gap-2">
                {isProductionComplete ? <Check className="w-4 h-4 text-green-600" /> : <span className="w-4 h-4 rounded-full border border-gray-300" />}
                <span className={isProductionComplete ? "text-gray-900" : "text-gray-500"}>Production Complete</span>
              </li>
              <li className="flex items-center gap-2">
                {hasFinalInvoice ? <Check className="w-4 h-4 text-green-600" /> : <span className="w-4 h-4 rounded-full border border-gray-300" />}
                <span className={hasFinalInvoice ? "text-gray-900" : "text-gray-500"}>Final Invoice Generated</span>
              </li>
              <li className="flex items-center gap-2">
                {isBalanceZero ? <Check className="w-4 h-4 text-green-600" /> : <span className="w-4 h-4 rounded-full border border-gray-300" />}
                <span className={isBalanceZero ? "text-gray-900" : "text-gray-500"}>Zero Balance (Paid in Full)</span>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-gray-500 font-medium mb-1">Tracking Information</p>
            {order.trackingNumber ? (
              <div className="space-y-1">
                <p><span className="font-medium text-gray-700">Number:</span> {order.trackingNumber}</p>
                {order.trackingUrl && (
                  <p><span className="font-medium text-gray-700">URL:</span> <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Track Package</a></p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 italic">No tracking info provided.</p>
            )}
          </div>
        </div>

        {canDispatch && !showDispatchForm && (
          <div className="pt-4 border-t">
            <Button onClick={() => setShowDispatchForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
              <Truck className="w-4 h-4" /> Prepare Dispatch
            </Button>
          </div>
        )}

        {showDispatchForm && (
          <div className="pt-4 border-t space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500">Tracking Number (Optional)</label>
                <Input value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} className="h-8 text-sm" placeholder="e.g. TRK123456789" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Tracking URL (Optional)</label>
                <Input value={trackingUrl} onChange={e => setTrackingUrl(e.target.value)} className="h-8 text-sm" placeholder="https://courier.com/track/..." type="url" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-gray-500">Internal Notes (Optional - Not sent to customer)</label>
                <Input value={notes} onChange={e => setNotes(e.target.value)} className="h-8 text-sm" placeholder="Any internal dispatch notes..." />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleDispatch} disabled={isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
                {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Confirm Dispatch
              </Button>
              <Button variant="outline" onClick={() => setShowDispatchForm(false)} disabled={isPending}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
