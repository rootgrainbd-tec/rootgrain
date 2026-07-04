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
  /** Array of image URLs for the product gallery */
  gallery?: string[];
}

export type ProductCategory = string;

export const PRODUCT_CATEGORIES = [
  "All",
  "Centerpiece Tables",
  "Accent & Side Tables",
  "Handcrafted Stools",
  "The Dining Collection",
  "Lounge Seating",
  "Artisan Chairs",
  "Serving & Display Trays",
  "Culinary Boards",
  "Coasters & Trivets",
  "Turned Wooden Bowls",
  "Plates & Platters",
  "Architectural Wood Tiles",
  "Kumiko"
];

// Map raw Sanity strings to our new Artisan Vibe labels
export const PRODUCT_CATEGORY_LABELS: Record<string, string> = {
  // Legacy mappings
  "dining-tables": "The Dining Collection",
  "coffee-tables": "Centerpiece Tables",
  "seating": "Lounge Seating",
  "tables": "Centerpiece Tables",
  "consoles": "Accent & Side Tables",
  "home-decor": "Architectural Wood Tiles",
  
  // New exact mappings
  "Coffee Table": "Centerpiece Tables",
  "Sofa Side Table": "Accent & Side Tables",
  "Stool": "Handcrafted Stools",
  "Dining": "The Dining Collection",
  "Sofa": "Lounge Seating",
  "Chair": "Artisan Chairs",
  "Serving Tray": "Serving & Display Trays",
  "Chopping Board": "Culinary Boards",
  "Coffee/Tea Coaster": "Coasters & Trivets",
  "Bowl": "Turned Wooden Bowls",
  "Plate": "Plates & Platters",
  "Wooden Tiles": "Architectural Wood Tiles",
  "Kumiko": "Kumiko",
  "Kumiko Art": "Kumiko"
};

export type WoodType =
  | "American Black Walnut"
  | "White Oak"
  | "Walnut"
  | "Cherry"
  | "Maple"
  | "Teak"
  | "Mahogany"
  | "Mehogony and Sisu";

export interface ProductImage {
  url: string;
  alt: string;
  position: number;
}

/**
 * Format a Taka amount as a BDT display string.
 * Example: 480000 → "৳ 4,80,000"
 */
export function formatPrice(taka: number): string {
  return `৳ ${taka.toLocaleString("en-BD")}`;
}
