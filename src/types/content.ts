import type { LucideIcon } from "lucide-react";

/** A step in the craftsmanship process — displayed as a card on the homepage */
export interface CraftProcess {
  /** Lucide icon component reference (not a JSX element) */
  icon: LucideIcon;
  title: string;
  description: string;
}

/** A customer testimonial displayed on the homepage */
export interface Testimonial {
  quote: string;
  author: string;
  location: string;
  /** The RootGrain piece they purchased */
  piece: string;
}

/** A navigation link in the header/mobile menu */
export interface NavLink {
  href: string;
  label: string;
}
