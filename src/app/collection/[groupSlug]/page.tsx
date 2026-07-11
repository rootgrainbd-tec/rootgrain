import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { CollectionClient } from "@/components/sections/CollectionClient";
import { getSiteConfig } from "@/data/site-config";
import type { Product, ProductCategory, WoodType } from "@/types/product";
import { client } from "../../../../sanity/lib/client";
import { urlForImage } from "../../../../sanity/lib/image";

export const dynamic = 'force-dynamic';

export default async function CategoryGroupPage(
  props: { 
    params: Promise<{ groupSlug: string }>,
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
  }
) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const { groupSlug } = params;
  const SITE_CONFIG = await getSiteConfig();

  // Find the category group
  const group = await client.fetch(`*[_type == "categoryGroup" && slug.current == $slug][0]{
    title,
    "categories": categories[]->name
  }`, { slug: groupSlug });

  if (!group) {
    notFound();
  }

  // Pagination Config
  const ITEMS_PER_PAGE = 12;
  const pageParam = searchParams.page;
  const currentPage = typeof pageParam === 'string' ? parseInt(pageParam) : 1;
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;

  // Filter Config
  const wood = searchParams.wood as string;
  const availability = searchParams.availability as string;
  const priceRange = searchParams.price as string;

  // Build GROQ Query Conditions
  // Base condition: must be a product and belong to one of the categories in this group
  const conditions = ['_type == "product"', 'category->name in $categories'];

  if (wood && wood !== "All") {
    conditions.push(`woodType == "${wood}"`);
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
  const totalCount = await client.fetch(`count(*[${queryFilter}])`, { categories: group.categories || [] });
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Fetch Paginated Products
  const sanityProducts = await client.fetch(`*[${queryFilter}] | order(_createdAt desc) [$start...$end] {
    _id, title, slug, category->{name}, price, comparePrice, woodType, dimensions, heroImage, shortDescription, inStock, featured, availability
  }`, { categories: group.categories || [], start, end });

  // Hardcode wood types so all options always appear
  const uniqueWoods = ['Teak', 'Mahogany', 'Sisu', 'Jackfruit', 'Jam', 'Kerosin', 'Neem', 'American Black Walnut', 'Cherry', 'White Oak'];

  const products: Product[] = sanityProducts.map((p: any) => ({
    id: p.slug?.current || p._id,
    name: p.title || p.name || 'Untitled',
    slug: p.slug?.current || '',
    category: (p.category?.name as ProductCategory) || 'Dining Tables',
    price: p.price,
    comparePrice: p.comparePrice,
    wood: (p.woodType || p.wood) as WoodType,
    dimensions: p.dimensions ? `${p.dimensions.length}x${p.dimensions.width}x${p.dimensions.height} ${p.dimensions.unit}` : '',
    image: p.heroImage ? urlForImage(p.heroImage).url() : '',
    description: p.shortDescription || '',
    inStock: p.inStock ?? true,
    featured: p.featured ?? false,
  }));

  return (
    <main className="min-h-screen pt-24 bg-[var(--ivory)]">
      <Navigation config={SITE_CONFIG} />
      
      {/* Group Header */}
      <div className="bg-[var(--parchment)] py-12 border-b border-[var(--walnut-light)]/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <h1 className="font-serif text-4xl lg:text-5xl text-[var(--walnut-dark)]">
            {group.title}
          </h1>
          <p className="text-[var(--walnut)] mt-4 max-w-2xl">
            Explore our meticulously crafted collection of {group.title.toLowerCase()}, 
            designed to bring timeless elegance to your space.
          </p>
        </div>
      </div>

      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
        <CollectionClient 
          products={products} 
          totalPages={totalPages}
          currentPage={currentPage}
          uniqueCategories={[]} // Don't show category filter on a specific tab page
          uniqueWoods={uniqueWoods}
          title={group.title}
          subtitle="Explore"
          basePath={`/collection/${groupSlug}`}
        />
      </Suspense>
      <Footer config={SITE_CONFIG} />
    </main>
  );
}
