import prisma from "@/lib/prisma";
import { MessageSquare, Users, ShoppingCart, DollarSign, TrendingUp, CreditCard } from "lucide-react";
import Link from "next/link";
import { RevenueChart } from "@/components/admin/RevenueChart";

export default async function AdminDashboard() {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const [totalInquiries, totalUsers, totalOrders, allOrders] = await Promise.all([
    prisma.inquiry.count(),
    prisma.user.count(),
    prisma.order.count(),
    prisma.order.findMany({
      select: { total: true, advancePaid: true, createdAt: true, status: true }
    })
  ]);

  let totalRevenue = 0;
  let thisMonthRevenue = 0;
  let pendingPayments = 0;
  
  // Calculate revenue per month for the last 6 months
  const monthlyDataMap = new Map<string, number>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = d.toLocaleString('default', { month: 'short' });
    monthlyDataMap.set(monthName, 0);
  }

  for (const order of allOrders) {
    if (order.status !== "CANCELLED" && order.status !== "REJECTED") {
      totalRevenue += order.total;
      
      if (order.createdAt >= firstDayOfMonth) {
        thisMonthRevenue += order.total;
      }
      
      const orderMonth = order.createdAt.toLocaleString('default', { month: 'short' });
      if (monthlyDataMap.has(orderMonth)) {
        monthlyDataMap.set(orderMonth, monthlyDataMap.get(orderMonth)! + order.total);
      }
    }
    
    // Calculate pending (total - advancePaid) for orders not yet delivered
    if (order.status !== "DELIVERED" && order.status !== "CANCELLED" && order.status !== "REJECTED") {
      pendingPayments += (order.total - (order.advancePaid || 0));
    }
  }

  const chartData = Array.from(monthlyDataMap.entries()).map(([month, revenue]) => ({
    month,
    revenue
  }));

  const stats = [
    { name: "Total Orders", value: totalOrders.toString(), icon: ShoppingCart, href: "/admin/orders" },
    { name: "Total Inquiries", value: totalInquiries.toString(), icon: MessageSquare, href: "/admin/inquiries" },
    { name: "Total Customers", value: totalUsers.toString(), icon: Users, href: "/admin/users" },
  ];

  const financialStats = [
    { name: "Total Revenue", value: `৳${totalRevenue.toLocaleString()}`, icon: DollarSign },
    { name: "This Month", value: `৳${thisMonthRevenue.toLocaleString()}`, icon: TrendingUp },
    { name: "Pending Payments", value: `৳${pendingPayments.toLocaleString()}`, icon: CreditCard },
  ];

  return (
    <div>
      <h1 className="text-2xl font-serif text-[var(--walnut-dark)] mb-6">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {financialStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-[var(--gold)]/10 border border-[var(--gold)]/30 p-6 rounded-sm">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[var(--gold)] text-white rounded-full">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-[var(--walnut)] font-medium uppercase tracking-wider">{stat.name}</p>
                  <p className="text-3xl font-serif text-[var(--walnut-dark)] mt-1">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[var(--ivory)] border border-[var(--walnut-light)]/20 p-6 rounded-sm">
          <h2 className="text-lg font-serif text-[var(--walnut-dark)] mb-4 border-b border-[var(--walnut-light)]/20 pb-4">Revenue Analytics (Last 6 Months)</h2>
          <RevenueChart data={chartData} />
        </div>

        <div className="flex flex-col gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link key={stat.name} href={stat.href} className="block">
                <div className="bg-[var(--cream)] border border-[var(--walnut-light)]/20 p-6 rounded-sm hover:border-[var(--gold)] transition-colors h-full">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-[var(--walnut-dark)] text-[var(--ivory)] rounded-full">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm text-[var(--walnut-light)] font-medium uppercase tracking-wider">{stat.name}</p>
                      <p className="text-3xl font-serif text-[var(--walnut-dark)] mt-1">{stat.value}</p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
