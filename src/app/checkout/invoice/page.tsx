import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import PrintButton from "./PrintButton";
import { getSiteConfig } from "@/data/site-config";

export default async function InvoicePage(props: { searchParams: Promise<{ order: string }> }) {
  const searchParams = await props.searchParams;
  
  if (!searchParams.order) notFound();

  const order = await prisma.order.findUnique({
    where: { orderNumber: searchParams.order },
    include: { items: true },
  });

  if (!order) notFound();

  const config = await getSiteConfig();

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white min-h-screen font-sans">
      {/* Print button container - hidden when printing */}
      <div className="flex justify-end mb-8 print:hidden">
        <PrintButton />
      </div>

      <div className="border border-gray-200 p-8 space-y-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-serif text-[var(--walnut-dark)] font-bold">INVOICE</h1>
            <p className="text-gray-500 mt-1">Order # {order.orderNumber}</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-[var(--gold)] uppercase">{config.name}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {config.address?.line1}<br/>
              {config.address?.line2}
            </p>
          </div>
        </div>

        <div className="flex justify-between border-t border-b border-gray-200 py-4">
          <div>
            <h3 className="font-semibold text-gray-700">Bill To:</h3>
            <p className="text-gray-600 mt-1">{(order.shippingAddress as any).name}</p>
            <p className="text-gray-600">{(order.shippingAddress as any).address}</p>
            <p className="text-gray-600">{(order.shippingAddress as any).district}, {(order.shippingAddress as any).division}</p>
            <p className="text-gray-600">{(order.shippingAddress as any).phone}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-600"><span className="font-semibold">Date:</span> {format(new Date(order.createdAt), 'PPP')}</p>
            <p className="text-gray-600 mt-1"><span className="font-semibold">Status:</span> {order.status}</p>
          </div>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-300 bg-gray-50">
              <th className="py-2 px-2 font-semibold">Item</th>
              <th className="py-2 px-2 font-semibold text-center">Qty</th>
              <th className="py-2 px-2 font-semibold text-right">Price</th>
              <th className="py-2 px-2 font-semibold text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="py-3 px-2">{item.productName}</td>
                <td className="py-3 px-2 text-center">{item.quantity}</td>
                <td className="py-3 px-2 text-right">৳{(item.unitPrice || 0).toLocaleString()}</td>
                <td className="py-3 px-2 text-right font-medium">৳{(item.total || 0).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end pt-4">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal:</span>
              <span>৳{(order.subtotal || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping:</span>
              <span>৳{(order.shippingCost || 0).toLocaleString()}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount:</span>
                <span>-৳{(order.discountAmount || 0).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2 mt-2">
              <span>Total:</span>
              <span>৳{(order.total || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-600 pt-2">
              <span>Advance Paid:</span>
              <span>৳{(order.advancePaid || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-semibold text-[var(--walnut)]">
              <span>Balance Due:</span>
              <span>৳{((order.total || 0) - (order.advancePaid || 0)).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-gray-500 pt-8 border-t border-gray-200">
          <p>Thank you for choosing {config.name}!</p>
          <div className="flex items-center justify-center gap-2 mt-1">
            {config.support?.email && <span>Email: {config.support.email}</span>}
            {config.support?.email && config.support?.phone && <span>|</span>}
            {config.support?.phone && <span>Phone: {config.support.phone}</span>}
          </div>
        </div>
      </div>
      
      {/* Script to auto-print if needed, but manual button is better */}
      {/* <script dangerouslySetInnerHTML={{ __html: "window.print();" }} /> */}
    </div>
  );
}
