import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) return null;

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-[var(--walnut)]">Order History</h1>
        <p className="text-[var(--walnut-light)] mt-2">
          View and track your past orders.
        </p>
      </div>

      <div className="space-y-6">
        {orders.length > 0 ? (
          orders.map((order) => (
            <Card key={order.id} className="border-[var(--walnut)]/20 shadow-sm">
              <CardHeader className="bg-[var(--ivory)] border-b border-[var(--walnut)]/10 pb-4">
                <div className="flex flex-col md:flex-row md:justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg font-serif text-[var(--walnut)]">Order {order.orderNumber}</CardTitle>
                    <CardDescription>Placed on {new Date(order.createdAt).toLocaleDateString()}</CardDescription>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="font-medium text-[var(--walnut)]">Total: ৳{(order.total / 100).toLocaleString()}</p>
                    <span className="inline-block mt-1 text-xs px-2 py-1 bg-[var(--gold)]/20 text-[var(--gold)] rounded-full">
                      {order.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-[var(--walnut)]">{item.productName}</p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-medium">৳{(item.total / 100).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t border-[var(--walnut)]/10 flex justify-end">
                  <Button asChild variant="outline" className="border-[var(--walnut)]/30 text-[var(--walnut)]">
                    <Link href={`/track?order=${order.orderNumber}`}>Track Order</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border border-[var(--walnut)]/20 shadow-sm">
            <p className="text-[var(--walnut-light)] mb-4">You have no order history.</p>
            <Button asChild className="bg-[var(--walnut)] hover:bg-[var(--walnut-light)] text-white">
              <Link href="/collection">Browse Products</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
