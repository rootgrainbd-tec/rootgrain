import type { Product } from "@/types/product";

/**
 * Signature Collection — the homepage featured products.
 * Prices in BDT paisa. Will migrate to database in Phase 2.
 */
export const SIGNATURE_COLLECTION: Product[] = [
  {
    id: "heritage-dining-table",
    name: "The Heritage Dining Table",
    slug: "heritage-dining-table",
    category: "dining-tables",
    price: 48000000,       // ৳4,80,000
    wood: "American Black Walnut",
    dimensions: '84" L × 42" W × 30" H',
    image: "/images/product-dining-table.png",
    description:
      "A centerpiece for gathering, crafted with sweeping grain patterns and sculptural organic edges.",
    inStock: true,
    featured: true,
  },
  {
    id: "artisan-coffee-table",
    name: "The Artisan Coffee Table",
    slug: "artisan-coffee-table",
    category: "coffee-tables",
    price: 22000000,       // ৳2,20,000
    wood: "White Oak",
    dimensions: '48" L × 24" W × 16" H',
    image: "/images/product-coffee-table.png",
    description:
      "Low and elegant, with rounded edges that soften any living space.",
    inStock: true,
    featured: true,
  },
  {
    id: "heritage-chair",
    name: "The Heritage Chair",
    slug: "heritage-chair",
    category: "seating",
    price: 16000000,       // ৳1,60,000
    wood: "Walnut",
    dimensions: '22" W × 20" D × 34" H',
    image: "/images/product-chair.png",
    description:
      "Ergonomic comfort meets timeless design, with visible joinery and hand-shaped spindles.",
    inStock: true,
    featured: true,
  },
  {
    id: "sculptural-bench",
    name: "The Sculptural Bench",
    slug: "sculptural-bench",
    category: "seating",
    price: 24000000,       // ৳2,40,000
    wood: "Walnut",
    dimensions: '60" L × 16" D × 18" H',
    image: "/images/product-bench.png",
    description:
      "A statement piece for entryways or dining spaces, with fluid organic form.",
    inStock: true,
    featured: true,
  },
  {
    id: "tea-table",
    name: "The Tea Table",
    slug: "tea-table",
    category: "tables",
    price: 18000000,       // ৳1,80,000
    wood: "Cherry",
    dimensions: '36" L × 24" W × 14" H',
    image: "/images/product-tea-table.png",
    description:
      "Low and refined, perfect for quiet moments and intimate gatherings.",
    inStock: true,
    featured: true,
  },
  {
    id: "console-table",
    name: "The Console Table",
    slug: "console-table",
    category: "consoles",
    price: 20000000,       // ৳2,00,000
    wood: "White Oak",
    dimensions: '48" L × 14" D × 32" H',
    image: "/images/product-console.png",
    description:
      "Architectural elegance for hallways and entryways, with clean lines and warm presence.",
    inStock: true,
    featured: true,
  },
];
