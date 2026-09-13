import { notFound } from "next/navigation";
import { client } from "../../../../../sanity/lib/client";
import { urlForImage } from "../../../../../sanity/lib/image";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { PRODUCT_CATEGORIES } from "@/types/product";
import type { Product, ProductCategory, WoodType } from "@/types/product";
import type { SanityProduct } from "@/types/sanity";
import { getSiteConfig } from "@/data/site-config";
import { CollectionClient } from "@/components/sections/CollectionClient";

export const revalidate = 60;

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const SITE_CONFIG = await getSiteConfig();
  const matchedCategory = PRODUCT_CATEGORIES.find((c: string) => 
    c.toLowerCase().replace(/[\s&/]+/g, '-').replace(/-+/g, '-') === resolvedParams.slug
  );
  if (!matchedCategory || matchedCategory === "All") {
    notFound();
  }

  const sanityProducts: SanityProduct[] = await client.fetch(`*[_type == "product"] {
    _id, name, title, slug, category->{name}, price, comparePrice, woodTypes, wood, dimensions, heroImage, heroVideo{..., asset->{playbackId, status}}, shortDescription, availability, inStock, featured, cardPreview, galleryImages[_type == "image" && defined(asset)]
  }`);

  const sanityMappedProducts: Product[] = sanityProducts.map((p) => {
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
      name: p.name || p.title || '',
      slug: p.slug?.current || '',
      category: p.category?.name as ProductCategory || 'Dining Tables',
      price: p.price || 0,
      comparePrice: p.comparePrice,
      wood: p.woodTypes?.length ? p.woodTypes.join(' · ') : undefined,
      woodTypes: (p.woodTypes || []),
      dimensions: p.dimensions ? `${p.dimensions.length}x${p.dimensions.width}x${p.dimensions.height} ${p.dimensions.unit}` : '',
      image: heroImageUrl || '',
      video: heroVideoId ? { playbackId: heroVideoId, status: p.heroVideo?.asset?.status } : undefined,
      description: p.shortDescription || '',
      inStock: p.inStock ?? (p.availability === 'Available' ? true : false),
      featured: p.featured ?? false,
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

  const products: Product[] = sanityMappedProducts;

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
