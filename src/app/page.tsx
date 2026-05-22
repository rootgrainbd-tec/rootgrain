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

import { CRAFT_PROCESSES } from "@/data/crafts";
import { SITE_CONFIG } from "@/data/site-config";
import type { Product, ProductCategory } from "@/types/product";

export default async function RootGrainHome() {
  const dbProducts = await prisma.product.findMany({
    where: { featured: true },
  });

  const dbTestimonials = await prisma.testimonial.findMany({
    where: { approved: true },
  });

  // Map to the strict types required by the Client Components, dropping Dates for serialization safety
  const products: Product[] = dbProducts.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    category: p.category as ProductCategory,
    price: p.price,
    comparePrice: p.comparePrice ?? undefined,
    wood: p.wood as any,
    dimensions: p.dimensions,
    image: p.image,
    description: p.description,
    inStock: p.inStock,
    featured: p.featured,
  }));

  const testimonials = dbTestimonials.map((t) => ({
    quote: t.quote,
    author: t.author,
    location: t.location,
    piece: t.piece,
  }));

  return (
    <main className="min-h-screen">
      <Navigation config={SITE_CONFIG} />
      <HeroSection />
      <CraftsmanshipSection crafts={CRAFT_PROCESSES} />
      <SignatureCollectionSection products={products} />
      <WorkshopStorySection />
      <MaterialPhilosophySection />
      <LifestyleInteriorsSection />
      <TestimonialsSection testimonials={testimonials} />
      <Footer config={SITE_CONFIG} />
    </main>
  );
}
