import { notFound } from "next/navigation";
import Image from "next/image";
import { client } from "../../../../sanity/lib/client";
import { urlForImage } from "../../../../sanity/lib/image";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { SITE_CONFIG } from "@/data/site-config";
import { formatPrice, PRODUCT_CATEGORY_LABELS } from "@/types/product";
import { Button } from "@/components/ui/button";

export const revalidate = 60;

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await client.fetch(`*[_type == "product" && slug.current == $slug][0] {
    _id, name, title, category->{name}, price, comparePrice, woodType, wood, dimensions, heroImage, galleryImages, fullDescription, shortDescription, description, availability, inStock
  }`, { slug: params.slug });

  if (!product) {
    notFound();
  }

  const name = product.name || product.title || '';
  const price = product.price || 0;
  const comparePrice = product.comparePrice;
  const rawCategory = product.category?.name || '';
  const categoryLabel = PRODUCT_CATEGORY_LABELS[rawCategory] || rawCategory;
  const wood = product.wood || product.woodType;
  const dimensionsStr = product.dimensions ? `${product.dimensions.length} x ${product.dimensions.width} x ${product.dimensions.height} ${product.dimensions.unit}` : null;
  const heroUrl = product.heroImage ? urlForImage(product.heroImage).url() : "/placeholder.jpg";
  const desc = product.description || product.shortDescription || '';
  const isAvailable = product.inStock ?? (product.availability === 'Available') ?? true;

  return (
    <main className="min-h-screen bg-[var(--ivory)]">
      <Navigation config={SITE_CONFIG} />
      
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-24">
          
          {/* Images */}
          <div className="space-y-6">
            <div className="relative aspect-square bg-[var(--parchment)]">
              <Image
                src={heroUrl}
                alt={name}
                fill
                className="object-cover"
                priority
              />
            </div>
            {/* Render gallery images here if they exist */}
            {product.galleryImages && product.galleryImages.length > 0 && (
              <div className="grid grid-cols-2 gap-6">
                {product.galleryImages.map((img: any, i: number) => (
                  <div key={i} className="relative aspect-square bg-[var(--parchment)]">
                    <Image
                      src={urlForImage(img).url()}
                      alt={`${name} gallery ${i+1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col">
            <span className="text-[var(--gold)] text-sm tracking-[0.4em] uppercase font-medium mb-4 block">
              {categoryLabel}
            </span>
            <h1 className="font-serif text-4xl md:text-5xl text-[var(--walnut-dark)] font-light mb-6">
              {name}
            </h1>
            
            <div className="flex items-center gap-4 mb-8">
              <span className="font-serif text-3xl text-[var(--walnut-dark)]">
                {formatPrice(price)}
              </span>
              {comparePrice && (
                <span className="font-serif text-xl text-[var(--walnut-light)] line-through">
                  {formatPrice(comparePrice)}
                </span>
              )}
            </div>

            <div className="prose prose-stone mb-12 text-[var(--walnut)]">
              <p>{desc}</p>
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

            <Button className="w-full bg-[var(--walnut-dark)] hover:bg-[var(--gold)] text-[var(--ivory)] py-8 text-sm tracking-widest uppercase transition-colors rounded-none">
              Inquire / Purchase
            </Button>
          </div>
        </div>
      </div>

      <Footer config={SITE_CONFIG} />
    </main>
  );
}
