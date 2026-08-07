import prisma from "@/lib/prisma";
import OrdersTable from "./OrdersTable";

export default async function OrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      items: true
    }
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-serif text-[var(--walnut-dark)]">Orders</h1>
        <p className="text-muted-foreground mt-2">Manage customer orders and manually track advance payments.</p>
      </div>
      
      <OrdersTable orders={orders} />
    </div>
  );
}
