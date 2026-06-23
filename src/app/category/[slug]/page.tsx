import { notFound } from "next/navigation";
import { client } from "../../../../sanity/lib/client";
import { urlForImage } from "../../../../sanity/lib/image";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { CollectionClient } from "@/components/sections/CollectionClient";
import { SITE_CONFIG } from "@/data/site-config";
import { PRODUCT_CATEGORIES, Product, ProductCategory } from "@/types/product";
import { SIGNATURE_COLLECTION } from "@/data/products";

export const revalidate = 60;

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  // Match slug to category name
  const matchedCategory = PRODUCT_CATEGORIES.find(c => 
    c.toLowerCase().replace(/[\s&/]+/g, '-').replace(/-+/g, '-') === resolvedParams.slug
  );

  if (!matchedCategory || matchedCategory === "All") {
    notFound();
  }

  const sanityProducts = await client.fetch(`*[_type == "product"] {
    _id, name, title, slug, category->{name}, price, comparePrice, woodType, wood, dimensions, heroImage, shortDescription, description, availability, inStock, featured
  }`);

  const sanityMappedProducts: Product[] = sanityProducts.map((p: any) => ({
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
    inStock: p.inStock ?? (p.availability === 'Available'),
    featured: p.featured ?? true,
  }));

  const products: Product[] = [...SIGNATURE_COLLECTION, ...sanityMappedProducts];

  return (
    <main className="min-h-screen">
      <Navigation config={SITE_CONFIG} />
      <CollectionClient 
        initialProducts={products} 
        title={matchedCategory} 
        subtitle="Category"
        allowedCategories={[matchedCategory]}
      />
      <Footer config={SITE_CONFIG} />
    </main>
  );
}
