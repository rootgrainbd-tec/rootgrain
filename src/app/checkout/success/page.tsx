"use client";

import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Suspense } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber");

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-center">
          <CheckCircle2 className="w-16 h-16 text-green-500" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-serif text-[var(--walnut-dark)]">Order Booked Successfully!</h1>
          {orderNumber && (
            <p className="text-gray-600">
              Order ID: <span className="font-semibold">{orderNumber}</span>
            </p>
          )}
        </div>

        <div className="bg-[#fff9f2] p-4 rounded-lg text-sm text-gray-700 text-left leading-relaxed">
          <strong>Next Steps:</strong>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li>Our representative will contact you shortly on your provided phone number.</li>
            <li>You will need to pay the 20% advance via manual transaction to confirm the order.</li>
            <li>Once confirmed, production and shipping will begin.</li>
          </ul>
        </div>

        <div className="pt-4">
          <Button asChild className="w-full bg-[var(--walnut-dark)] hover:bg-[var(--gold)] text-[var(--ivory)]">
            <Link href="/shop">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
