import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata: Metadata = {
  title: "My Account | Rootgrain",
};

const sidebarNavItems = [
  { title: "Overview", href: "/account" },
  { title: "Orders", href: "/account/orders" },
  { title: "Addresses", href: "/account/address" },
  { title: "Wishlist", href: "/account/wishlist" },
  { title: "Settings", href: "/account/settings" },
];

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="container py-10 md:py-20 min-h-[80vh]">
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 shrink-0">
          <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto pb-4 md:pb-0">
            {sidebarNavItems.map((item) => (
              <Link 
                key={item.href}
                href={item.href}
                className="whitespace-nowrap px-4 py-2 text-sm font-medium rounded-md hover:bg-[var(--walnut)]/10 text-[var(--walnut)] transition-colors"
              >
                {item.title}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
