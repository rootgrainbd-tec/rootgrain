import prisma from "@/lib/prisma";
import { MessageSquare, Users, ShoppingCart } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
  const [totalInquiries, totalUsers, totalOrders] = await Promise.all([
    prisma.inquiry.count(),
    prisma.user.count(),
    prisma.order.count(),
  ]);

  const stats = [
    { name: "Total Inquiries", value: totalInquiries, icon: MessageSquare, href: "/admin/inquiries" },
    { name: "Total Customers", value: totalUsers, icon: Users, href: "/admin/users" },
    { name: "Total Orders", value: totalOrders, icon: ShoppingCart, href: "/admin/orders" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-serif text-[var(--walnut-dark)] mb-6">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.name} href={stat.href} className="block">
              <div className="bg-[var(--cream)] border border-[var(--walnut-light)]/20 p-6 rounded-sm hover:border-[var(--gold)] transition-colors">
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
  );
}
