import type { SiteConfig } from "@/types/site";
import type { NavLink } from "@/types/content";

import { client } from "../../sanity/lib/client";

/** Navigation links used in header and mobile menu */
export const NAV_LINKS: NavLink[] = [
  { href: "/#house-and-home", label: "House & Home" },
  { href: "/#craftsmanship", label: "Craftsmanship" },
  { href: "/collection", label: "Collection" },
  { href: "/#workshop", label: "Workshop" },
  { href: "/#philosophy", label: "Philosophy" },
  { href: "/#contact", label: "Contact" },
];

export async function getSiteConfig(): Promise<SiteConfig> {
  const [sanityConfig, categoryGroupsRaw] = await Promise.all([
    client.fetch(`*[_type == "siteSettings"][0]`),
    client.fetch(`*[_type == "categoryGroup"] | order(order asc) {
      _id,
      title,
      "slug": slug.current,
      "categories": categories[]->name
    }`)
  ]);
  
  const categoryGroups = categoryGroupsRaw?.map((g: any) => ({
    id: g._id,
    label: g.title,
    slug: g.slug,
    categories: g.categories || [],
  })) || [];

  if (!sanityConfig) {
    return {
      name: "RootGrain",
      tagline: "Artisan Furniture",
      description: "RootGrain crafts heirloom-quality wooden furniture.",
      url: "https://rootgrain.bd",
      support: { phone: "", email: "", hours: "" },
      address: { line1: "", line2: "" },
      social: {},
      legal: { copyright: "", origin: "" },
      categoryGroups
    };
  }

  return {
    name: sanityConfig.siteTitle || "RootGrain",
    tagline: sanityConfig.tagline || "Artisan Furniture",
    description: sanityConfig.description || "RootGrain crafts heirloom-quality wooden furniture.",
    url: "https://rootgrain.bd",
    support: {
      phone: sanityConfig.phone || "",
      email: sanityConfig.email || "",
      hours: sanityConfig.hours || "",
    },
    address: {
      line1: sanityConfig.address?.line1 || "",
      line2: sanityConfig.address?.line2 || "",
    },
    social: {
      instagram: sanityConfig.socialLinks?.instagram,
      facebook: sanityConfig.socialLinks?.facebook,
      twitter: sanityConfig.socialLinks?.twitter,
    },
    legal: {
      copyright: sanityConfig.copyright || "",
      origin: sanityConfig.origin || "",
    },
    categoryGroups
  };
}
