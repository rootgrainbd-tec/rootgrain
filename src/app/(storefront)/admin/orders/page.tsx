import prisma from "@/lib/prisma";
import OrdersTable from "./OrdersTable";
import { OrderStatus, Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    redirect("/login");
  }

  const resolvedParams = await searchParams;
  
  const pageParam = resolvedParams.page;
  let page = 1;
  if (typeof pageParam === "string") {
    const parsed = parseInt(pageParam, 10);
    if (!isNaN(parsed) && parsed > 0) {
      page = parsed;
    }
  }

  const queryParam = resolvedParams.query;
  const query = typeof queryParam === "string" ? queryParam : "";

  const statusParam = resolvedParams.status;
  let status: OrderStatus | undefined = undefined;
  if (typeof statusParam === "string" && Object.values(OrderStatus).includes(statusParam as OrderStatus)) {
    status = statusParam as OrderStatus;
  }

  const TAKE = 20;
  const skip = (page - 1) * TAKE;

  const where: Prisma.OrderWhereInput = {};
  
  if (status) {
    where.status = status;
  }

  if (query) {
    where.OR = [
      { orderNumber: { contains: query, mode: "insensitive" } },
      {
        shippingAddress: {
          path: ["name"],
          string_contains: query,
        }
      },
      {
        shippingAddress: {
          path: ["phone"],
          string_contains: query,
        }
      }
    ];
  }

  const [orders, totalCount] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: TAKE,
      include: {
        items: true
      }
    }),
    prisma.order.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / TAKE));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-serif text-[var(--walnut-dark)]">Orders</h1>
        <p className="text-muted-foreground mt-2">Manage customer orders and manually track advance payments.</p>
      </div>
      
      <OrdersTable 
        orders={orders} 
        pagination={{
          page,
          totalPages,
          totalCount,
        }}
        currentQuery={query}
        currentStatus={status}
      />
    </div>
  );
}
