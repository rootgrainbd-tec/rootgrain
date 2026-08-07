import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { WishlistActions } from "@/components/account/WishlistActions";
import { client } from "../../../../../sanity/lib/client";
import { urlForImage } from "../../../../../sanity/lib/image";
import { formatPrice } from "@/types/product";

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

  // Fetch wishlist items
  const wishlistItems = await prisma.wishlist.findMany({
    where: { userId: session.user.id },
  });

  const productIds = wishlistItems.map(item => item.productId);

  // Fetch actual product details from Sanity
  let sanityProducts: any[] = [];
  if (productIds.length > 0) {
    sanityProducts = await client.fetch(`*[_type == "product" && _id in $ids] {
      _id, title, slug, price, heroImage
    }`, { ids: productIds });
  }

  // Map Sanity products by ID for easy lookup
  const productMap = sanityProducts.reduce((acc, p) => {
    acc[p._id] = p;
    return acc;
  }, {} as Record<string, any>);

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
                <Link href="/collection">Continue Shopping</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {wishlistItems.map((item) => {
                const product = productMap[item.productId];
                
                // Fallbacks if product was deleted in Sanity
                const name = product?.title || "Product Unavailable";
                const price = product?.price || 0;
                const imageUrl = product?.heroImage ? urlForImage(product.heroImage).width(200).url() : "/placeholder.jpg";
                const productUrl = product?.slug?.current ? `/product/${product.slug.current}` : "#";

                return (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Link href={productUrl} className="block shrink-0">
                        <div className="relative w-16 h-16 bg-gray-100 rounded-md overflow-hidden">
                          <Image src={imageUrl} alt={name} fill className="object-cover" />
                        </div>
                      </Link>
                      <div>
                        <Link href={productUrl}>
                          <h4 className="font-medium text-[var(--walnut)] hover:text-[var(--gold)] transition-colors">{name}</h4>
                        </Link>
                        <p className="text-sm font-bold text-[var(--primary)] mt-1">
                          {formatPrice(price)}
                        </p>
                      </div>
                    </div>
                    <WishlistActions id={item.id} />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
