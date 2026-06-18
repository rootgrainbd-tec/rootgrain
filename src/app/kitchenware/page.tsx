import { client } from "../../../sanity/lib/client";
import { urlForImage } from "../../../sanity/lib/image";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { CollectionClient } from "@/components/sections/CollectionClient";
import { SITE_CONFIG } from "@/data/site-config";
import type { Product, ProductCategory } from "@/types/product";

export const revalidate = 60;

export default async function KitchenwarePage() {
  const sanityProducts = await client.fetch(`*[_type == "product"] {
    _id, name, title, slug, category->{name}, price, comparePrice, woodType, wood, dimensions, heroImage, shortDescription, description, availability, inStock, featured
  }`);

  const products: Product[] = sanityProducts.map((p: any) => ({
    id: p._id,
    name: p.name || p.title || '',
    slug: p.slug?.current || '',
    category: p.category?.name as ProductCategory || 'Dining Tables',
    price: p.price || 0,
    comparePrice: p.comparePrice,
    wood: (p.wood || p.woodType) as any,
    dimensions: p.dimensions ? `${p.dimensions.length}x${p.dimensions.width}x${p.dimensions.height} ${p.dimensions.unit}` : '',
    image: p.heroImage ? urlForImage(p.heroImage).url() : '',
    description: p.description || p.shortDescription || '',
    inStock: p.inStock ?? (p.availability === 'Available') ?? true,
    featured: p.featured ?? true,
  }));

  const allowedCategories = [
    "Serving & Display Trays",
    "Culinary Boards",
    "Coasters & Trivets",
    "Turned Wooden Bowls",
    "Plates & Platters",
  ];

  return (
    <main className="min-h-screen">
      <Navigation config={SITE_CONFIG} />
      <CollectionClient 
        initialProducts={products} 
        title="Kitchenware & Dining" 
        subtitle="Culinary Elegance"
        allowedCategories={allowedCategories}
      />
      <Footer config={SITE_CONFIG} />
    </main>
  );
}
