import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Heart } from "lucide-react";

export default async function WishlistPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) return null;

  const wishlistItems = await prisma.wishlist.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-[var(--walnut)]">My Wishlist</h1>
        <p className="text-[var(--walnut-light)] mt-2">
          Products you have saved for later.
        </p>
      </div>

      <div>
        {wishlistItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 
              Here we would normally map over wishlistItems, 
              extract the productIds, and fetch the full product data from Sanity.
              For now, we display a placeholder count.
            */}
            <div className="col-span-full text-[var(--walnut)] p-6 bg-[var(--ivory)] rounded-lg border border-[var(--walnut)]/20">
              <p>You have {wishlistItems.length} items in your wishlist.</p>
              <p className="text-sm mt-2">Full Sanity product integration for wishlist is pending.</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg border border-[var(--walnut)]/20 shadow-sm flex flex-col items-center">
            <Heart className="w-12 h-12 text-[var(--walnut)]/20 mb-4" />
            <p className="text-[var(--walnut-light)] mb-6">Your wishlist is empty.</p>
            <Button asChild className="bg-[var(--walnut)] hover:bg-[var(--walnut-light)] text-white">
              <Link href="/shop">Explore Collection</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
