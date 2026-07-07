import { Suspense } from "react";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { CollectionClient } from "@/components/sections/CollectionClient";
import { getSiteConfig } from "@/data/site-config";
import type { Product, ProductCategory, WoodType } from "@/types/product";
import type { SanityProduct } from "@/types/sanity";
import { client } from "../../../sanity/lib/client";
import { urlForImage } from "../../../sanity/lib/image";

export const dynamic = 'force-dynamic';

export default async function CollectionPage(
  props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
  }
) {
  const searchParams = await props.searchParams;
  const SITE_CONFIG = await getSiteConfig();

  // Pagination Config
  const ITEMS_PER_PAGE = 12;
  const pageParam = searchParams.page;
  const currentPage = typeof pageParam === 'string' ? parseInt(pageParam) : 1;
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;

  // Filter Config
  const category = searchParams.category as string;
  const wood = searchParams.wood as string;
  const availability = searchParams.availability as string;
  const priceRange = searchParams.price as string;
  const searchQuery = searchParams.q as string;

  // Build GROQ Query Conditions
  const conditions = ['_type == "product"'];

  if (searchQuery && searchQuery.trim() !== "") {
    conditions.push(`(title match "*${searchQuery.trim()}*" || description match "*${searchQuery.trim()}*")`);
  }
  if (category && category !== "All") {
    conditions.push(`category->name == "${category}"`);
  }
  if (wood && wood !== "All") {
    conditions.push(`woodType match "*${wood}*"`);
  }
  if (availability && availability !== "All") {
    conditions.push(`availability == "${availability}"`);
  }
  if (priceRange && priceRange !== "All") {
    const [minStr, maxStr] = priceRange.split("-");
    const min = parseInt(minStr);
    const max = parseInt(maxStr);
    if (!isNaN(min)) conditions.push(`price >= ${min}`);
    if (!isNaN(max)) conditions.push(`price <= ${max}`);
  }

  const queryFilter = conditions.join(" && ");

  // Fetch Total Count
  const totalCount = await client.fetch(`count(*[${queryFilter}])`);
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Fetch Paginated Products
  const sanityProducts: SanityProduct[] = await client.fetch(`*[${queryFilter}] | order(_createdAt desc) [$start...$end] {
    _id, title, slug, category->{name}, price, comparePrice, woodType, dimensions, heroImage, description, inStock, featured, availability
  }`, { start, end });

  // Fetch all categories for the filter dropdown (so even empty ones show up)
  const uniqueCategories = await client.fetch(`*[_type == "category"].name`);
  // Hardcode wood types so all options always appear
  const uniqueWoods = ['Teak', 'Mahogany', 'Sisu', 'Jackfruit', 'Jam', 'Kerosin', 'Neem', 'American Black Walnut', 'Cherry', 'White Oak'];

  // Map Sanity products to the strict Product type expected by the UI
  const products: Product[] = sanityProducts.map((p) => ({
    id: p.slug?.current || p._id,
    name: p.title || p.name || 'Untitled',
    slug: p.slug?.current || '',
    category: (p.category?.name as ProductCategory) || 'Dining Tables',
    price: p.price,
    comparePrice: p.comparePrice,
    wood: (p.woodType || p.wood) as WoodType,
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
        <CollectionClient 
          products={products} 
          totalPages={totalPages}
          currentPage={currentPage}
          uniqueCategories={uniqueCategories}
          uniqueWoods={uniqueWoods}
          title="The Complete Collection"
          subtitle="Our Catalog"
          basePath="/collection"
        />
      </Suspense>
      <Footer config={SITE_CONFIG} />
    </main>
  );
}
