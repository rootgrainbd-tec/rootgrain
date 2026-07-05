"use server";

import { client } from "../../sanity/lib/client";
import { SanityProduct } from "@/types/sanity";

export async function searchProducts(query: string): Promise<SanityProduct[]> {
  if (!query || query.trim() === "") {
    return [];
  }

  const searchTerm = query.trim() + "*";

  // Search by title, category name, or wood type
  const products = await client.fetch(
    `*[_type == "product" && (
      title match $searchTerm ||
      category->name match $searchTerm ||
      woodType match $searchTerm
    )] {
      _id,
      title,
      slug,
      price,
      comparePrice,
      heroImage,
      category->{name}
    }[0...10]`,
    { searchTerm },
    { next: { revalidate: 0 } }
  );

  return products;
}
