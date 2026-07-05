import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { WishlistActions } from "@/components/account/WishlistActions";

export const metadata = {
  title: "My Wishlist - Rootgrain",
  description: "View and manage your wishlist items",
};

export default async function WishlistPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return (
      <div className="flex justify-center items-center h-48">
        <p>Please login to view your wishlist.</p>
      </div>
    );
  }

  // Fetch wishlist items (we assume a Wishlist model or similar in Prisma)
  // For now, this is a placeholder UI since the exact product schema isn't fully linked
  const wishlistItems = await prisma.wishlist.findMany({
    where: { userId: session.user.id },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[var(--walnut)]">My Wishlist</h2>
        <p className="text-muted-foreground">
          Items you have saved for later.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          {wishlistItems.length === 0 ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 text-orange-600 mb-4">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-medium text-[var(--walnut)]">Your wishlist is empty</h3>
              <p className="text-muted-foreground mt-2 mb-6">
                Explore our store and add items you love to your wishlist.
              </p>
              <Button asChild className="bg-[var(--primary)] hover:bg-[var(--gold)] text-white">
                <Link href="/">Continue Shopping</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {wishlistItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden">
                      {/* Product Image placeholder */}
                      <div className="w-full h-full bg-gray-200"></div>
                    </div>
                    <div>
                      <h4 className="font-medium text-[var(--walnut)]">Product ID: {item.productId}</h4>
                      <p className="text-sm font-bold text-[var(--primary)]">
                        ৳0
                      </p>
                    </div>
                  </div>
                  <WishlistActions id={item.id} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
