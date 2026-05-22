import type { SiteConfig } from "@/types/site";
import type { NavLink } from "@/types/content";

/**
 * Single source of truth for all site-wide configuration.
 * Every component that displays contact info, legal text, or brand
 * details reads from this one object.
 */
export const SITE_CONFIG: SiteConfig = {
  name: "RootGrain",
  tagline: "Artisan Furniture",
  description:
    "RootGrain crafts heirloom-quality wooden furniture using time-honored artisan techniques. Each piece tells a story of craftsmanship, permanence, and timeless beauty.",
  url: "https://rootgrain.com",
  support: {
    phone: "+88 01917389253",
    email: "rootgrainbd@gmail.com",
    hours: "Tue–Sat: 10am–6pm",
  },
  address: {
    line1: "Mujibnagar road, Rail Bazar",
    line2: "Darsana, Chuadanga",
  },
  social: {
    instagram: "#",
    facebook: "#",
    twitter: "#",
  },
  legal: {
    copyright: `© ${new Date().getFullYear()} RootGrain. All rights reserved.`,
    origin: "Crafted with legacy. Made in Bangladesh.",
  },
};

/** Navigation links used in header and mobile menu */
export const NAV_LINKS: NavLink[] = [
  { href: "#craftsmanship", label: "Craftsmanship" },
  { href: "#collection", label: "Collection" },
  { href: "#workshop", label: "Workshop" },
  { href: "#philosophy", label: "Philosophy" },
  { href: "#contact", label: "Contact" },
];
