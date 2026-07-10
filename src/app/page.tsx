import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/sections/HeroSection";
import { CraftsmanshipSection } from "@/components/sections/CraftsmanshipSection";
import { ExpandableCategorySection } from "@/components/sections/ExpandableCategorySection";
import { WorkshopStorySection } from "@/components/sections/WorkshopStorySection";
import { MaterialPhilosophySection } from "@/components/sections/MaterialPhilosophySection";
import { LifestyleInteriorsSection } from "@/components/sections/LifestyleInteriorsSection";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";

import { getSiteConfig } from "@/data/site-config";
import type { Product, ProductCategory, WoodType } from "@/types/product";
import { client } from "../../sanity/lib/client";
import { urlForImage } from "../../sanity/lib/image";
import type { SanityProduct, SanityTestimonial, SanityHomepage, SanityCraftsmanshipStep, SanityWorkshop } from "@/types/sanity";

// Optional: Set revalidation time if using ISR
export const revalidate = 60;

export default async function RootGrainHome() {
  // Fetch everything concurrently from Sanity
  const [sanityProducts, sanityTestimonials, homepage, workshop, craftsmanshipSteps, SITE_CONFIG] = await Promise.all([
    client.fetch(`*[_type == "product"]{
      _id, title, slug, category->{name}, price, comparePrice, woodType, inStock, heroImage, description, featured
    }`),
    client.fetch(`*[_type == "testimonial" && approved == true]`),
    client.fetch(`*[_type == "homepage"][0]`),
    client.fetch(`*[_type == "workshop"][0]`),
    client.fetch(`*[_type == "craftsmanshipStep"] | order(order asc)`),
    getSiteConfig(),
  ]);

  const sanityMappedProducts: Product[] = sanityProducts.map((p: any) => ({
    id: p.slug?.current || p._id,
    name: p.title || p.name || 'Untitled',
    slug: p.slug?.current || '',
    category: p.category?.name as ProductCategory || 'Dining Tables',
    price: p.price,
    comparePrice: p.comparePrice,
    wood: (p.wood || p.woodType) as WoodType,
    dimensions: p.dimensions ? `${p.dimensions.length}x${p.dimensions.width}x${p.dimensions.height} ${p.dimensions.unit}` : '',
    image: p.heroImage ? urlForImage(p.heroImage).url() : '',
    description: p.description || '',
    inStock: p.inStock ?? true,
    featured: p.featured ?? true,
  }));

  const products: Product[] = sanityMappedProducts;

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
      <div className="cv-auto">
        <CraftsmanshipSection steps={craftsmanshipSteps} />
      </div>
      <div className="cv-auto">
        <ExpandableCategorySection products={products} tabGroups={SITE_CONFIG.categoryGroups || []} />
      </div>
      <div className="cv-auto">
        <WorkshopStorySection data={workshop} stats={homepage?.statsItems} />
      </div>
      <div className="cv-auto">
        <MaterialPhilosophySection data={homepage} />
      </div>
      <div className="cv-auto">
        <LifestyleInteriorsSection data={homepage} />
      </div>
      <div className="cv-auto">
        <TestimonialsSection testimonials={testimonials} />
      </div>
      <Footer config={SITE_CONFIG} />
    </main>
  );
}
