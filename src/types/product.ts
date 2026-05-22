export interface Product {
  /** Unique identifier — matches future Prisma `cuid()` */
  id: string;
  /** Display name shown on cards and detail pages */
  name: string;
  /** URL-safe identifier for routing (e.g., "heritage-dining-table") */
  slug: string;
  /** Product category key */
  category: ProductCategory;
  /** Price in BDT paisa (1 BDT = 100 paisa). Format at display time. */
  price: number;
  /** Original price for strike-through display, in BDT paisa */
  comparePrice?: number;
  /** Primary wood material */
  wood: WoodType;
  /** Physical dimensions as display string */
  dimensions: string;
  /** Primary image path (relative to /public) */
  image: string;
  /** Short description for cards and previews */
  description: string;
  /** Whether the item is currently available */
  inStock: boolean;
  /** Whether to feature on homepage */
  featured: boolean;
}

export type ProductCategory =
  | "dining-tables"
  | "coffee-tables"
  | "seating"
  | "tables"
  | "consoles"
  | "home-decor";

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  "dining-tables": "Dining Tables",
  "coffee-tables": "Coffee Tables",
  "seating": "Seating",
  "tables": "Tables",
  "consoles": "Console Tables",
  "home-decor": "Home Decor",
};

export type WoodType =
  | "American Black Walnut"
  | "White Oak"
  | "Walnut"
  | "Cherry"
  | "Maple"
  | "Teak"
  | "Mahogany";

export interface ProductImage {
  url: string;
  alt: string;
  position: number;
}

/**
 * Format a paisa amount as a BDT display string.
 * Example: 48000000 → "৳4,80,000"
 */
export function formatPrice(paisa: number): string {
  const taka = paisa / 100;
  return `৳${taka.toLocaleString("en-BD")}`;
}
