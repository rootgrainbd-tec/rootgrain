import type { Product } from "@/types/product";

/**
 * Signature Collection — the homepage featured products.
 * Prices in BDT paisa. Will migrate to database in Phase 2.
 */
export const SIGNATURE_COLLECTION: Product[] = [
  {
    id: "rg-001-center-coffee-table",
    name: "RG-001 Center Coffee Table",
    slug: "rg-001-center-coffee-table",
    category: "Centerpiece Tables",
    price: 3100000,       // ৳31,000
    wood: "Mehogony and Sisu",
    dimensions: '42" × 24" × 18"',
    image: "/images/products/RG-001/sideview-1.png",
    gallery: [
      "/images/products/RG-001/joint-view-2.png",
      "/images/products/RG-001/joint-view.png",
      "/images/products/RG-001/side-4.png",
      "/images/products/RG-001/side5.png",
      "/images/products/RG-001/sideview-2.png",
      "/images/products/RG-001/sideview-3.png",
      "/images/products/RG-001/top-view.png",
      "/images/products/RG-001/corner-side.png"
    ],
    description: `Handcrafted from three organically shaped mehogony root pieces, carefully joined using traditional sisu butterfly joints. The live-edge top preserves the natural contours, grain patterns, and character of the original wood, making every table truly one of a kind. Supported by a solid sisu wood base and finished with a glossy shellac coating, this coffee table showcases authentic craftsmanship, natural beauty, and lasting durability. Designed as both a functional centerpiece and a statement piece for contemporary living spaces.

MATERIALS
• Top: Solid Mehogony Root Wood (3 Pieces Joined)
• Butterfly Joints: Solid Sisu Wood
• Frame & Legs: Solid Sisu Wood
• Finish: Glossy Shellac Coating

KEY FEATURES
• Handmade craftsmanship
• Organic freeform shape
• Three mehogony root pieces joined together
• Handcrafted sisu butterfly joints
• Solid sisu wood frame and legs
• Glossy shellac finish
• Natural live-edge design
• Unique grain patterns and character
• Every piece is one of a kind`,
    inStock: false,
    featured: true,
  },
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
