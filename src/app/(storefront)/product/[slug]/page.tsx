import { notFound } from "next/navigation";
import { client } from "../../../../../sanity/lib/client";
import { urlForImage } from "../../../../../sanity/lib/image";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { getSiteConfig } from "@/data/site-config";
import { formatPrice, PRODUCT_CATEGORY_LABELS } from "@/types/product";
import { ProductActions } from "@/components/product/ProductActions";
import { ProductGallery } from "@/components/sections/ProductGallery";
import { ProductReviews } from "@/components/product/ProductReviews";
import { RelatedProducts } from "@/components/product/RelatedProducts";
import { RecentlyViewed } from "@/components/product/RecentlyViewed";
import { RecentlyViewedTracker } from "@/components/product/RecentlyViewedTracker";
import type { Metadata } from "next";
import type { Product, ProductCategory, WoodType } from "@/types/product";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const product = await client.fetch(`*[_type == "product" && slug.current == $slug][0] {
    name, title, shortDescription, heroImage
  }`, { slug: resolvedParams.slug });

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  const name = product.name || product.title || "Product";
  const description = product.shortDescription || "Handcrafted wooden furniture by RootGrain.";
  const imageUrl = product.heroImage ? urlForImage(product.heroImage).url() : undefined;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://rootgrain.com";

  return {
    title: `${name} | RootGrain`,
    description,
    alternates: {
      canonical: `${appUrl}/product/${resolvedParams.slug}`,
    },
    openGraph: {
      title: `${name} | RootGrain`,
      description,
      url: `${appUrl}/product/${resolvedParams.slug}`,
      type: "website",
      images: imageUrl ? [
        {
          url: imageUrl,
          width: 800,
          height: 800,
          alt: name,
        }
      ] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} | RootGrain`,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const SITE_CONFIG = await getSiteConfig();
  const product = await client.fetch(`*[_type == "product" && slug.current == $slug][0] {
    _id, name, title, category->{name}, price, comparePrice, woodType, wood, dimensions, heroImage, galleryImages, fullDescription, shortDescription, availability, inStock
  }`, { slug: resolvedParams.slug });

  let relatedProducts: Product[] = [];
  if (product && product.category?.name) {
    const related = await client.fetch(`*[_type == "product" && category->name == $category && slug.current != $slug][0...4] {
      _id, name, title, slug, category->{name}, price, heroImage
    }`, { category: product.category.name, slug: resolvedParams.slug });
    
    relatedProducts = related.map((p: any) => ({
      id: p._id,
      slug: p.slug?.current || '',
      name: p.name || p.title || '',
      category: p.category?.name as ProductCategory || 'Dining Tables',
      price: p.price || 0,
      image: p.heroImage ? urlForImage(p.heroImage).url() : "/placeholder.jpg",
    }));
  }

  if (!product) {
    notFound();
  }

  const name = product.name || product.title || '';
  const price = product.price || 0;
  const comparePrice = product.comparePrice;
  const rawCategory = product.category?.name || '';
  const categoryLabel = PRODUCT_CATEGORY_LABELS[rawCategory] || rawCategory;
  const wood = product.wood || product.woodType;
  const dimensionsStr = product.dimensionsStr || (product.dimensions ? `${product.dimensions.length} x ${product.dimensions.width} x ${product.dimensions.height} ${product.dimensions.unit}` : null);
  const heroUrl = product.heroUrl || (product.heroImage ? urlForImage(product.heroImage).url() : "/placeholder.jpg");
  const desc = product.shortDescription || '';
  const isAvailable = product.inStock ?? (product.availability === 'Available');

  return (
    <main className="min-h-screen bg-[var(--ivory)]">
      <Navigation config={SITE_CONFIG} />
      
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-40 pb-24 lg:pt-48 lg:pb-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-24">
          
          {/* Images */}
          <ProductGallery 
            heroUrl={heroUrl} 
            galleryImages={product.galleryImages || []} 
            productName={name} 
          />

          {/* Details */}
          <div className="flex flex-col">
            <span className="text-[var(--gold)] text-sm tracking-[0.4em] uppercase font-medium mb-4 block">
              {categoryLabel}
            </span>
            <h1 className="font-serif text-4xl md:text-5xl text-[var(--walnut-dark)] font-light mb-6 lining-nums">
              {name}
            </h1>
            
            <div className="flex items-center gap-4 mb-8">
              <span className="font-sans font-medium text-3xl text-[var(--walnut-dark)] tracking-tight">
                {formatPrice(price)}
              </span>
              {comparePrice && (
                <span className="font-sans font-medium text-xl text-[var(--walnut-light)] line-through tracking-tight">
                  {formatPrice(comparePrice)}
                </span>
              )}
            </div>

            <div className="prose prose-stone mb-12 text-[var(--walnut)] whitespace-pre-wrap">
              {desc}
            </div>

            <div className="grid grid-cols-2 gap-y-6 gap-x-12 py-8 border-y border-[var(--walnut-light)]/20 mb-12">
              <div>
                <span className="block text-xs tracking-wider uppercase text-[var(--walnut-light)] mb-1">Wood Type</span>
                <span className="text-[var(--walnut-dark)]">{wood}</span>
              </div>
              {dimensionsStr && (
                <div>
                  <span className="block text-xs tracking-wider uppercase text-[var(--walnut-light)] mb-1">Dimensions</span>
                  <span className="text-[var(--walnut-dark)]">{dimensionsStr}</span>
                </div>
              )}
              <div>
                <span className="block text-xs tracking-wider uppercase text-[var(--walnut-light)] mb-1">Availability</span>
                <span className="text-[var(--walnut-dark)]">{isAvailable ? "In Stock" : "Made to Order"}</span>
              </div>
            </div>

            <ProductActions 
              product={{
                id: resolvedParams.slug,
                name: name,
                price: price,
                image: heroUrl,
                isAvailable: isAvailable
              }}
              whatsappNumber={SITE_CONFIG.support.phone.whatsapp}
            />
          </div>
        </div>
        
        <ProductReviews productId={product._id} />
        <RelatedProducts products={relatedProducts} />
        <RecentlyViewed currentProductId={resolvedParams.slug} />
      </div>

      <RecentlyViewedTracker 
        product={{
          id: resolvedParams.slug,
          name: name,
          price: price,
          image: heroUrl,
          category: rawCategory,
        }} 
      />

      <Footer config={SITE_CONFIG} />
    </main>
  );
}
