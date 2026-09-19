export type SanityProductProjectionInput = {
  _id: string;
  _updatedAt: string;
  name?: string;
  slug?: string;
  category?: string;
  price?: number;
  woodTypes?: string[];
  dimensions?: string | { length?: number; width?: number; height?: number };
  image?: string;
  description?: string;
  shippingType?: string | null;
  availability?: string;
  leadTimeDays?: number;
};

export type CommerceProjection = {
  sanityId: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  wood: string | undefined;
  dimensions: string;
  image: string;
  description: string;
  shippingType: string | null;
  inStock: boolean;
  isMto: boolean;
  baseLeadTimeDays: number;
  sanityUpdatedAt: Date;
};

/**
 * Pure function to map Sanity product state to Commerce Projection state.
 * Throws if required fields are missing, mirroring legacy SyncService behavior.
 */
export function mapSanityToCommerceProjection(sanityProduct: SanityProductProjectionInput): CommerceProjection {
  if (!sanityProduct.name) throw new Error("Missing required field: name/title");
  if (sanityProduct.price === null || sanityProduct.price === undefined) throw new Error("Missing required field: price");
  if (!sanityProduct.category) throw new Error("Missing required field: category");
  if (!sanityProduct.image) throw new Error("Missing required field: image/heroImage");

  if (!sanityProduct._updatedAt) {
    throw new Error("Missing required field: _updatedAt from Sanity");
  }
  const sanityUpdatedAt = new Date(sanityProduct._updatedAt);
  if (isNaN(sanityUpdatedAt.getTime())) {
    throw new Error(`Invalid _updatedAt date format from Sanity: ${sanityProduct._updatedAt}`);
  }

  // Canonical identity
  const sanityId = sanityProduct._id.replace(/^drafts\./, "");
  const slug = sanityProduct.slug || "";

  // Presentation fields
  let dimensionsStr = "Unknown";
  if (sanityProduct.dimensions && typeof sanityProduct.dimensions === 'object') {
    const d = sanityProduct.dimensions;
    dimensionsStr = d.length && d.width && d.height 
      ? `${d.length}" L × ${d.width}" W × ${d.height}" H`
      : "Unknown";
  } else if (typeof sanityProduct.dimensions === 'string') {
    dimensionsStr = sanityProduct.dimensions;
  }

  const wood = Array.isArray(sanityProduct.woodTypes) && sanityProduct.woodTypes.length > 0
    ? sanityProduct.woodTypes.join(" · ")
    : undefined;

  // Commerce derivation
  const isMto = sanityProduct.availability === "Made-to-Order";
  const inStock = sanityProduct.availability !== "Sold";
  
  const baseLeadTimeDays = (typeof sanityProduct.leadTimeDays === "number" && Number.isInteger(sanityProduct.leadTimeDays) && sanityProduct.leadTimeDays > 0)
    ? sanityProduct.leadTimeDays
    : 30;

  return {
    sanityId,
    name: sanityProduct.name,
    slug: slug,
    category: sanityProduct.category,
    price: sanityProduct.price,
    wood,
    dimensions: dimensionsStr,
    image: sanityProduct.image,
    description: sanityProduct.description ?? "",
    shippingType: sanityProduct.shippingType ?? null,
    inStock,
    isMto,
    baseLeadTimeDays,
    sanityUpdatedAt,
  };
}
