"use server";

import { client } from "../../sanity/lib/client";
import { logger } from "@/lib/logger";
import { SanityProduct } from "@/types/sanity";
import { unstable_noStore as noStore } from "next/cache";
import { urlForImage } from "../../sanity/lib/image";

export async function searchProducts(query: string): Promise<SanityProduct[]> {
  noStore();

  if (!query || query.trim() === "") {
    return [];
  }

  // Use both leading and trailing wildcard for a more robust partial match
  const searchTerm = "*" + query.trim() + "*";

  // Search by title, category name, or wood type
  const products = await client.fetch(
    `*[_type == "product" && (
      title match $searchTerm ||
      category->name match $searchTerm ||
      woodTypes[] match $searchTerm
    )] {
      _id,
      title,
      slug,
      price,
      comparePrice,
      woodTypes,
      heroImage,
      heroVideo{..., asset->{playbackId, status}},
      category->{name},
      cardPreview,
      galleryImages[_type == "image" && defined(asset)]
    }[0...10]`,
    { searchTerm },
    { cache: "no-store", next: { revalidate: 0 } }
  );

  const normalizedProducts = products.map((p: any) => {
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
      ...p,
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

  logger.info({ searchTerm, resultCount: normalizedProducts.length }, "Search completed");

  return normalizedProducts;
}
