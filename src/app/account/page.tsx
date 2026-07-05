import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) return null;

  const recentOrders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-[var(--walnut)]">Account Overview</h1>
        <p className="text-[var(--walnut-light)] mt-2">
          Welcome back, {session.user.name || session.user.email}!
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-[var(--walnut)]/20 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl font-serif text-[var(--walnut)]">Recent Orders</CardTitle>
            <CardDescription>Your latest purchases</CardDescription>
          </CardHeader>
          <CardContent>
            {recentOrders.length > 0 ? (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium text-[var(--walnut)]">{order.orderNumber}</p>
                      <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">৳{(order.total / 100).toLocaleString()}</p>
                      <span className="text-xs px-2 py-1 bg-[var(--gold)]/20 text-[var(--gold)] rounded-full">
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
                <Button asChild variant="outline" className="w-full mt-4">
                  <Link href="/account/orders">View All Orders</Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-[var(--walnut-light)] mb-4">You haven't placed any orders yet.</p>
                <Button asChild className="bg-[var(--walnut)] hover:bg-[var(--walnut-light)] text-white">
                  <Link href="/">Start Shopping</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-[var(--walnut)]/20 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl font-serif text-[var(--walnut)]">Profile Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium text-[var(--walnut)]">{session.user.name || "Not set"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-[var(--walnut)]">{session.user.email}</p>
            </div>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/account/settings">Edit Profile</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
