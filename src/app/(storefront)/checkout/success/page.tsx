import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { verifySuccessToken } from "@/lib/capability-token";

export default function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const orderNumber = searchParams.orderNumber as string | undefined;
  const token = searchParams.token as string | undefined;

  let advanceRequired = 0;
  let isMtoOrder = false;

  const payload = verifySuccessToken(token);
  if (payload && payload.orderNumber === orderNumber) {
    advanceRequired = payload.requiredAdvance;
    isMtoOrder = payload.isMtoOrder;
  }

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
            <li>
              {payload ? (
                <>You will need to pay the advance of <strong>৳{advanceRequired.toLocaleString()}</strong> via manual transaction to confirm the order.</>
              ) : (
                <>You will need to pay the required advance (check your email for the exact amount) via manual transaction to confirm the order.</>
              )}
            </li>
            <li>Once confirmed, production and shipping will begin.</li>
          </ul>
        </div>

        <div className="pt-4 space-y-3">
          <Button asChild className="w-full bg-[var(--walnut-dark)] hover:bg-[var(--gold)] text-[var(--ivory)]">
            <Link href="/collection">Continue Shopping</Link>
          </Button>
          {orderNumber && (
            <Button asChild variant="outline" className="w-full border-[var(--walnut)]/30 text-[var(--walnut)]">
              <Link href={`/checkout/invoice?order=${orderNumber}`} target="_blank">View / Print Invoice</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
