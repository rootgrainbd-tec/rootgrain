import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import PaymentLedger from "./PaymentLedger";
import AdminNotes from "./AdminNotes";
import MtoManagement from "./MtoManagement";
import DispatchManager from "./DispatchManager";
import DeliveryManager from "./DeliveryManager";

export default async function AdminOrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  console.log("SERVER SIDE PARAMS:", resolvedParams);
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user as any).role !== "ADMIN") {
    redirect("/login");
  }

  const order = await prisma.order.findUnique({
    where: { id: resolvedParams.id },
    include: {
      items: true,
      customRequest: true,
      paymentRecords: {
        orderBy: { createdAt: "asc" }
      },
      events: {
        orderBy: { occurredAt: "desc" }
      },
      internalNotes: {
        orderBy: { createdAt: "desc" }
      },
      documents: {
        where: { documentType: "INVOICE" },
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!order) {
    notFound();
  }

  const shippingAddress = order.shippingAddress as any;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/orders" className="text-gray-500 hover:text-gray-900 flex items-center gap-1 text-sm font-medium transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back to Orders
          </Link>
          <div>
            <h1 className="text-3xl font-serif text-[var(--walnut-dark)]">Order {order.orderNumber}</h1>
            <p className="text-muted-foreground mt-1">Manage order details and payment history.</p>
          </div>
        </div>
        {order.customRequest && (
          <Link 
            href={`/admin/custom-requests/${order.customRequest.id}`}
            className="text-sm font-medium text-[var(--walnut)] hover:text-[var(--gold)] underline underline-offset-4"
          >
            View Original Request
          </Link>
        )}
      </div>

      {order.isMtoOrder ? (
        <MtoManagement order={order as any} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-sm border shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Customer Details</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p><span className="font-medium">Name:</span> {shippingAddress?.name || "N/A"}</p>
              <p><span className="font-medium">Phone:</span> {shippingAddress?.phone || "N/A"}</p>
              <p><span className="font-medium">Email:</span> {shippingAddress?.email || "N/A"}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-sm border shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Shipping Address</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p>{shippingAddress?.street}</p>
              <p>{shippingAddress?.district}, {shippingAddress?.division}</p>
              <p>{shippingAddress?.postCode}</p>
            </div>
          </div>
        </div>
      )}

      {order.isMtoOrder && (
        <AdminNotes orderId={order.id} notes={order.internalNotes || []} />
      )}

      <DispatchManager order={order} />
      <DeliveryManager order={order} />

      <div className="bg-white p-6 rounded-sm border shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Order Items</h3>
        <div className="border rounded-sm divide-y">
          {order.items.map((item: any) => (
            <div key={item.id} className="flex justify-between items-center p-4">
              <div>
                <p className="font-medium text-gray-900">{item.productName}</p>
                <p className="text-sm text-gray-500">Qty: {item.quantity} x ৳{item.unitPrice.toLocaleString()}</p>
              </div>
              <p className="font-medium text-[var(--walnut-dark)]">৳{item.total.toLocaleString()}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <div className="text-right text-sm text-gray-600 space-y-1">
            <p>Subtotal: ৳{order.subtotal.toLocaleString()}</p>
            <p>Shipping: ৳{order.shippingCost.toLocaleString()}</p>
            {order.discountAmount > 0 && (
              <p className="text-green-600">Discount: -৳{order.discountAmount.toLocaleString()}</p>
            )}
            <p className="font-bold text-lg pt-2 border-t mt-2 text-[var(--walnut-dark)]">
              Total: ৳{order.total.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <PaymentLedger order={order as any} />
    </div>
  );
}

