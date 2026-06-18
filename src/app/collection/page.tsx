import { Suspense } from "react";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { CollectionClient } from "@/components/sections/CollectionClient";
import { SITE_CONFIG } from "@/data/site-config";
import type { Product, ProductCategory } from "@/types/product";
import { client } from "../../../sanity/lib/client";
import { urlForImage } from "../../../sanity/lib/image";

export const revalidate = 60;

export default async function CollectionPage() {
  // Fetch all products from Sanity
  const sanityProducts = await client.fetch(`*[_type == "product"] {
    _id, name, slug, category->{name}, price, comparePrice, wood, dimensions, heroImage, description, inStock, featured
  }`);

  // Map Sanity products to the strict Product type expected by the UI
  const products: Product[] = sanityProducts.map((p: any) => ({
    id: p._id,
    name: p.name,
    slug: p.slug?.current || '',
    category: (p.category?.name as ProductCategory) || 'Dining Tables',
    price: p.price,
    comparePrice: p.comparePrice,
    wood: p.wood as any,
    dimensions: p.dimensions ? `${p.dimensions.length}x${p.dimensions.width}x${p.dimensions.height} ${p.dimensions.unit}` : '',
    image: p.heroImage ? urlForImage(p.heroImage).url() : '',
    description: p.description || '',
    inStock: p.inStock ?? true,
    featured: p.featured ?? false,
  }));

  return (
    <main className="min-h-screen pt-24 bg-[var(--ivory)]">
      <Navigation config={SITE_CONFIG} />
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
        <CollectionClient initialProducts={products} />
      </Suspense>
      <Footer config={SITE_CONFIG} />
    </main>
  );
}
