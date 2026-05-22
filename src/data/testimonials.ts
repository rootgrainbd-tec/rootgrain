import type { Testimonial } from "@/types/content";

/**
 * Customer testimonials displayed on the homepage.
 * Will migrate to database with moderation in Phase 2.
 */
export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Our dining table has become the heart of our home. Every meal feels special when gathered around something made with such care and intention. The wood grain tells a story, and now our family does too.",
    author: "Sarah & James Morrison",
    location: "Portland, Oregon",
    piece: "Heritage Dining Table",
  },
  {
    quote:
      "In a world of disposable furniture, finding RootGrain was like discovering a treasure. The bench we purchased will outlive us all, and that's exactly the point. This is furniture as it should be.",
    author: "David Chen",
    location: "San Francisco, California",
    piece: "Sculptural Bench",
  },
  {
    quote:
      "The coffee table is stunning—elegant yet approachable, refined yet warm. But what I love most is knowing the hands that shaped it. There's soul in every curve.",
    author: "Emma Thompson",
    location: "Austin, Texas",
    piece: "Artisan Coffee Table",
  },
];
