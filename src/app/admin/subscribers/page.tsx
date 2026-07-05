import prisma from "@/lib/prisma";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function SubscribersPage() {
  const subscribers = await prisma.subscriber.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-serif text-[var(--walnut-dark)]">Newsletter Subscribers</h1>
        <Button variant="outline" className="gap-2 text-[var(--walnut)]" asChild>
          <a
            href={`data:text/csv;charset=utf-8,Email,Date\n${subscribers
              .map((s) => `${s.email},${new Date(s.createdAt).toLocaleDateString()}`)
              .join("\n")}`}
            download={`subscribers_${new Date().toISOString().slice(0, 10)}.csv`}
          >
            <Download className="w-4 h-4" /> Export CSV
          </a>
        </Button>
      </div>

      <div className="bg-white rounded-sm border shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Email Address</th>
              <th className="px-4 py-3 font-medium">Subscribed Date</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {subscribers.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-4 py-8 text-center text-muted-foreground">
                  No subscribers found.
                </td>
              </tr>
            ) : (
              subscribers.map((sub) => (
                <tr key={sub.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium">{sub.email}</td>
                  <td className="px-4 py-3">{new Date(sub.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
