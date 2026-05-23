import prisma from "@/lib/prisma";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/sections/HeroSection";
import { CraftsmanshipSection } from "@/components/sections/CraftsmanshipSection";
import { SignatureCollectionSection } from "@/components/sections/SignatureCollectionSection";
import { WorkshopStorySection } from "@/components/sections/WorkshopStorySection";
import { MaterialPhilosophySection } from "@/components/sections/MaterialPhilosophySection";
import { LifestyleInteriorsSection } from "@/components/sections/LifestyleInteriorsSection";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";

import { SITE_CONFIG } from "@/data/site-config";
import type { Product, ProductCategory } from "@/types/product";
import { client } from "../../sanity/lib/client";
import { urlForImage } from "../../sanity/lib/image";

// Optional: Set revalidation time if using ISR
export const revalidate = 60;

export default async function RootGrainHome() {
  // Fetch everything concurrently from Sanity
  const [homepage, craftsmanshipSteps, sanityProducts, workshop, sanityTestimonials] = await Promise.all([
    client.fetch(`*[_type == "homepage"][0]`),
    client.fetch(`*[_type == "craftsmanshipStep"] | order(order asc)`),
    client.fetch(`*[_type == "product" && featured == true] {
      _id, name, slug, category->{name}, price, comparePrice, wood, dimensions, heroImage, description, inStock, featured
    }`),
    client.fetch(`*[_type == "workshop"][0]`),
    client.fetch(`*[_type == "testimonial" && approved == true]`)
  ]);

  // Map Sanity products to the strict Product type expected by the UI
  const products: Product[] = sanityProducts.map((p: any) => ({
    id: p._id,
    name: p.name,
    slug: p.slug?.current || '',
    category: p.category?.name as ProductCategory || 'Dining Tables',
    price: p.price,
    comparePrice: p.comparePrice,
    wood: p.wood as any,
    dimensions: p.dimensions ? `${p.dimensions.length}x${p.dimensions.width}x${p.dimensions.height} ${p.dimensions.unit}` : '',
    image: p.heroImage ? urlForImage(p.heroImage).url() : '',
    description: p.description || '',
    inStock: p.inStock ?? true,
    featured: p.featured ?? true,
  }));

  const testimonials = sanityTestimonials.map((t: any) => ({
    quote: t.quote,
    author: t.author,
    location: t.location,
    piece: t.piece,
  }));

  return (
    <main className="min-h-screen">
      <Navigation config={SITE_CONFIG} />
      <HeroSection data={homepage} />
      <CraftsmanshipSection steps={craftsmanshipSteps} />
      <SignatureCollectionSection products={products} />
      <WorkshopStorySection data={workshop} stats={homepage?.statsItems} />
      <MaterialPhilosophySection data={homepage} />
      <LifestyleInteriorsSection />
      <TestimonialsSection testimonials={testimonials} />
      <Footer config={SITE_CONFIG} />
    </main>
  );
}
