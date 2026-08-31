"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { beginCustomRequestReview, finalizeCustomRequestQuote } from "@/app/actions/custom-request";
import { format } from "date-fns";

type Item = {
  id: string;
  name: string;
  quantity: number;
  agreedUnitPrice: number | null;
};

type RequestProps = {
  id: string;
  status: string;
  channel: string;
  subtotal: number;
  total: number;
  deliveryCharge: number;
  requiredAdvance: number;
  estimatedCompletionDate: Date | null;
  items: Item[];
};

export default function QuotePrepClient({ request }: { request: RequestProps }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quote form state
  const [prices, setPrices] = useState<Record<string, number>>(
    request.items.reduce((acc, item) => ({ ...acc, [item.id]: item.agreedUnitPrice || 0 }), {})
  );
  const [deliveryCharge, setDeliveryCharge] = useState(request.deliveryCharge || 0);
  const [advance, setAdvance] = useState(request.requiredAdvance || 0);
  const [completionDate, setCompletionDate] = useState<string>(
    request.estimatedCompletionDate ? format(new Date(request.estimatedCompletionDate), "yyyy-MM-dd") : ""
  );
  const [isAdvanceOverridden, setIsAdvanceOverridden] = useState(false);

  // Derived calculations
  const subtotal = request.items.reduce((sum, item) => sum + (prices[item.id] || 0) * item.quantity, 0);
  const total = subtotal + deliveryCharge;

  // Auto-calculate 50% advance if not manually overridden
  useEffect(() => {
    if (!isAdvanceOverridden) {
      setAdvance(Math.floor(total * 0.5));
    }
  }, [total, isAdvanceOverridden]);

  const handleStartReview = async () => {
    setLoading(true);
    setError(null);
    try {
      const idempotencyKey = uuidv4();
      const res = await beginCustomRequestReview(request.id, idempotencyKey);
      if (!res.success) {
        setError(res.error || "Failed to start review");
      } else {
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizeQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    if (!completionDate) {
      setError("Estimated completion date is required");
      setLoading(false);
      return;
    }

    try {
      const idempotencyKey = uuidv4();
      const quoteData = {
        items: request.items.map(item => ({
          id: item.id,
          agreedUnitPrice: prices[item.id] || 0
        })),
        deliveryCharge,
        requiredAdvance: advance,
        estimatedCompletionDate: new Date(completionDate)
      };

      const res = await finalizeCustomRequestQuote(request.id, quoteData as any, idempotencyKey);
      
      if (!res.success) {
        setError(res.error || "Failed to finalize quote");
      } else {
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (request.status === "SUBMITTED") {
    return (
      <div className="bg-white border rounded-lg shadow-sm p-6 mt-6">
        <h2 className="text-lg font-bold mb-4">Operational Review</h2>
        <p className="text-gray-600 mb-4">
          This request is currently waiting for operational review.
        </p>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}
        <button
          onClick={handleStartReview}
          disabled={loading}
          className="bg-indigo-600 text-white px-4 py-2 rounded font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Starting..." : "Start Review"}
        </button>
      </div>
    );
  }

  if (request.status === "UNDER_REVIEW") {
    if (request.channel === "ADMIN_OFFLINE") {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg shadow-sm p-6 mt-6">
          <h2 className="text-lg font-bold text-blue-900 mb-2">Offline Request Under Review</h2>
          <p className="text-blue-800 text-sm">
            This request was created via Admin Offline channel. Commercial terms are agreed upon offline.
            Quote generation is bypassed. Convert to order in the next phase.
          </p>
        </div>
      );
    }

    // CUSTOMER_ONLINE form
    return (
      <div className="bg-white border rounded-lg shadow-sm p-6 mt-6">
        <h2 className="text-lg font-bold mb-4">Prepare Quote</h2>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}
        
        <form onSubmit={handleFinalizeQuote} className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-medium border-b pb-2">Item Pricing</h3>
            {request.items.map(item => (
              <div key={item.id} className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                </div>
                <div className="w-48">
                  <label className="text-xs text-gray-500 block mb-1">Unit Price (BDT)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={prices[item.id]}
                    onChange={(e) => setPrices({ ...prices, [item.id]: parseInt(e.target.value) || 0 })}
                    className="w-full border rounded px-3 py-1.5 text-sm"
                  />
                </div>
                <div className="w-32 text-right">
                  <label className="text-xs text-gray-500 block mb-1">Total</label>
                  <div className="font-medium text-sm pt-1">
                    BDT {((prices[item.id] || 0) * item.quantity).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-medium border-b pb-2">Logistics & Totals</h3>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Delivery Charge (BDT)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={deliveryCharge}
                  onChange={(e) => setDeliveryCharge(parseInt(e.target.value) || 0)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Estimated Completion Date</label>
                <input
                  type="date"
                  required
                  value={completionDate}
                  onChange={(e) => setCompletionDate(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg space-y-2 border">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>BDT {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Delivery Charge</span>
                <span>BDT {deliveryCharge.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2">
                <span>Total</span>
                <span>BDT {total.toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-2">
              <label className="text-sm font-medium text-gray-700 block mb-1">Required Advance (BDT)</label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  min="0"
                  max={total}
                  required
                  value={advance}
                  onChange={(e) => {
                    setIsAdvanceOverridden(true);
                    setAdvance(parseInt(e.target.value) || 0);
                  }}
                  className="w-48 border rounded px-3 py-2"
                />
                <span className="text-xs text-gray-500">
                  {total > 0 ? `(${Math.round((advance / total) * 100)}%)` : '(0%)'}
                  {!isAdvanceOverridden && ' - Default 50% applied'}
                </span>
                {isAdvanceOverridden && (
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsAdvanceOverridden(false);
                      setAdvance(Math.floor(total * 0.5));
                    }}
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    Reset to 50%
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white px-4 py-3 rounded font-bold hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "Finalizing Quote..." : "Finalize Quote (Irreversible)"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (request.status === "QUOTE_READY") {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg shadow-sm p-6 mt-6">
        <h2 className="text-lg font-bold text-green-900 mb-4">Quote Finalized</h2>
        <div className="grid grid-cols-2 gap-4 text-sm text-green-800">
          <div><strong>Subtotal:</strong> BDT {request.subtotal.toLocaleString()}</div>
          <div><strong>Delivery Charge:</strong> BDT {request.deliveryCharge.toLocaleString()}</div>
          <div className="text-base"><strong>Total:</strong> BDT {request.total.toLocaleString()}</div>
          <div><strong>Required Advance:</strong> BDT {request.requiredAdvance.toLocaleString()}</div>
        </div>
      </div>
    );
  }

  return null;
}
