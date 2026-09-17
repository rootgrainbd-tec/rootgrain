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
import { client } from "../../../sanity/lib/client";
import { urlForImage } from "../../../sanity/lib/image";
import type { SanityProduct, SanityTestimonial, SanityHomepage, SanityCraftsmanshipStep, SanityWorkshop, SanityCraftsmanshipSection } from "@/types/sanity";
import { CatalogService } from "@/services/catalog.service";

// Optional: Set revalidation time if using ISR
export const revalidate = 60;

export default async function RootGrainHome() {
  // Fetch everything concurrently from Sanity
  const [sanityProducts, sanityTestimonials, homepage, workshop, craftsmanshipSteps, craftsmanshipSection, SITE_CONFIG] = await Promise.all([
    client.fetch(`*[_type == "product"]{
      _id, title, slug, category->{name}, price, comparePrice, woodTypes, inStock, heroImage, heroVideo{..., asset->{playbackId, status}}, shortDescription, featured, cardPreview, galleryImages[_type == "image" && defined(asset)]
    }`),
    client.fetch(`*[_type == "testimonial" && approved == true]`),
    client.fetch(`*[_type == "homepage"][0]{
      ...,
      heroVideo{..., asset->{playbackId, status}},
      lifestyleVideo{..., asset->{playbackId, status}}
    }`),
    client.fetch(`*[_type == "workshop"][0]{
      ...,
      workshopVideo{..., asset->{playbackId, status}}
    }`),
    client.fetch(`*[_type == "craftsmanshipStep"] | order(order asc)`),
    client.fetch(`*[_id == "craftsmanshipSection"][0]`),
    getSiteConfig(),
  ]);

  const sanityMappedProducts: Product[] = sanityProducts.map((p: any) => {
    const heroImageUrl = p.heroImage?.asset ? urlForImage(p.heroImage).url() : undefined;
    const heroVideoId = p.heroVideo?.asset?.playbackId;

    let galleryUrls: string[] = [];
    if (p.galleryImages && Array.isArray(p.galleryImages)) {
      galleryUrls = p.galleryImages
        .filter((img: any) => img?.asset)
        .map((img: any) => urlForImage(img).url())
        .filter((url: string) => url !== heroImageUrl);
    }

    return {
      id: p.slug?.current || p._id,
      name: p.title || p.name || 'Untitled',
      slug: p.slug?.current || '',
      category: p.category?.name as ProductCategory || 'Dining Tables',
      price: p.price,
      comparePrice: p.comparePrice,
      wood: p.woodTypes?.length ? p.woodTypes.join(' · ') : undefined,
      woodTypes: (p.woodTypes || []),
      dimensions: p.dimensions ? `${p.dimensions.length}x${p.dimensions.width}x${p.dimensions.height} ${p.dimensions.unit}` : '',
      image: heroImageUrl || '',
      video: heroVideoId ? { playbackId: heroVideoId, status: p.heroVideo.asset.status } : undefined,
      description: p.shortDescription || '',
      inStock: p.inStock ?? true,
      featured: p.featured ?? true,
      cardMedia: {
        previewType: p.cardPreview?.previewType || "default",
        imageBehavior: p.cardPreview?.imageBehavior,
        videoAutoplay: p.cardPreview?.videoAutoplay,
        heroImageUrl: heroImageUrl,
        heroVideoId: heroVideoId,
        galleryImageUrls: galleryUrls
      }
    };
  });

  const products = await CatalogService.enrichProducts(sanityMappedProducts);

  const testimonials = sanityTestimonials.map((t: any) => ({
    quote: t.quote,
    author: t.clientName,
    location: t.clientLocation,
    piece: t.productPurchased,
  }));

  return (
    <main className="min-h-screen">
      <Navigation config={SITE_CONFIG} />
      <HeroSection data={homepage} />
      <div className="cv-auto">
        <ExpandableCategorySection products={products} tabGroups={SITE_CONFIG.categoryGroups || []} />
      </div>
      <div className="cv-auto">
        <CraftsmanshipSection data={craftsmanshipSection} steps={craftsmanshipSteps} />
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
