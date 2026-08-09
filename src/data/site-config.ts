import { cache } from "react";
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

const FALLBACK_PHONE = "+8801632300103";

function parsePhone(rawPhone: string) {
  const digits = rawPhone.replace(/\D/g, "");
  let normalized = digits;
  if (normalized.startsWith("01") && normalized.length === 11) {
    normalized = "88" + normalized;
  }
  
  let display = rawPhone;
  if (normalized.length === 13 && normalized.startsWith("8801")) {
    display = `0${normalized.slice(3, 5)}-${normalized.slice(5, 7)}-${normalized.slice(7, 10)}-${normalized.slice(10, 13)}`;
  }
  
  return {
    raw: rawPhone,
    display,
    tel: `+${normalized}`,
    whatsapp: normalized,
  };
}

export const getSiteConfig = cache(async function getSiteConfig(): Promise<SiteConfig> {
  const [sanityConfig, categoryGroupsRaw] = await Promise.all([
    client.fetch(`*[_type == "siteSettings" && _id == "siteSettings"][0] {
      ...,
      "logoUrl": logo.asset->url,
      "logoDarkUrl": logoDark.asset->url,
      "logoEmailUrl": logoEmail.asset->url,
      "logoSquareUrl": logoSquare.asset->url,
      "faviconUrl": favicon.asset->url,
      "ogImageUrl": ogImage.asset->url,
      seo
    }`),
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

  const rawPhone = sanityConfig?.phone || FALLBACK_PHONE;
  const siteUrl = sanityConfig?.websiteUrl || process.env.NEXT_PUBLIC_APP_URL || "https://rootgrain.bd";

  return {
    name: sanityConfig?.siteTitle || "RootGrain",
    tagline: sanityConfig?.tagline || "",
    description: sanityConfig?.description || "",
    seo: {
      seoTitle: sanityConfig?.seo?.seoTitle,
      seoDescription: sanityConfig?.seo?.seoDescription,
    },
    url: siteUrl,
    logoUrl: sanityConfig?.logoUrl || `${siteUrl}/images/rootgrain-logo.svg`,
    logoDarkUrl: sanityConfig?.logoDarkUrl || `${siteUrl}/images/rootgrain-logo-dark.svg`,
    logoEmailUrl: sanityConfig?.logoEmailUrl || sanityConfig?.logoUrl || `${siteUrl}/images/rootgrain-logo.png`,
    logoSquareUrl: sanityConfig?.logoSquareUrl || `${siteUrl}/images/logo-new.png`,
    faviconUrl: sanityConfig?.faviconUrl || `${siteUrl}/images/logo-new.png`,
    ogImageUrl: sanityConfig?.ogImageUrl || `${siteUrl}/images/hero-workshop.png`,
    support: {
      phone: parsePhone(rawPhone),
      email: sanityConfig?.email || "",
      hours: sanityConfig?.hours || "",
    },
    address: {
      line1: sanityConfig?.address?.line1 || "",
      line2: sanityConfig?.address?.line2 || "",
    },
    social: {
      instagram: sanityConfig?.socialLinks?.instagram,
      facebook: sanityConfig?.socialLinks?.facebook,
      twitter: sanityConfig?.socialLinks?.twitter,
      youtube: sanityConfig?.socialLinks?.youtube,
      linkedin: sanityConfig?.socialLinks?.linkedin,
      pinterest: sanityConfig?.socialLinks?.pinterest,
    },
    legal: {
      copyright: sanityConfig?.copyright || "",
      origin: sanityConfig?.origin || "",
    },
    categoryGroups
  };
});

export async function getFreshSiteConfig(): Promise<SiteConfig> {
  const [sanityConfig, categoryGroupsRaw] = await Promise.all([
    client.fetch(`*[_type == "siteSettings" && _id == "siteSettings"][0] {
      ...,
      "logoUrl": logo.asset->url,
      "logoDarkUrl": logoDark.asset->url,
      "logoEmailUrl": logoEmail.asset->url,
      "logoSquareUrl": logoSquare.asset->url,
      "faviconUrl": favicon.asset->url,
      "ogImageUrl": ogImage.asset->url,
      seo
    }`, {}, { cache: 'no-store', next: { revalidate: 0 } }),
    client.fetch(`*[_type == "categoryGroup"] | order(order asc) {
      _id,
      title,
      "slug": slug.current,
      "categories": categories[]->name
    }`, {}, { cache: 'no-store', next: { revalidate: 0 } })
  ]);
  
  const categoryGroups = categoryGroupsRaw?.map((g: any) => ({
    id: g._id,
    label: g.title,
    slug: g.slug,
    categories: g.categories || [],
  })) || [];

  const rawPhone = sanityConfig?.phone || FALLBACK_PHONE;
  const siteUrl = sanityConfig?.websiteUrl || process.env.NEXT_PUBLIC_APP_URL || "https://rootgrain.bd";

  return {
    name: sanityConfig?.siteTitle || "RootGrain",
    tagline: sanityConfig?.tagline || "",
    description: sanityConfig?.description || "",
    seo: {
      seoTitle: sanityConfig?.seo?.seoTitle,
      seoDescription: sanityConfig?.seo?.seoDescription,
    },
    url: siteUrl,
    logoUrl: sanityConfig?.logoUrl || `${siteUrl}/images/rootgrain-logo.svg`,
    logoDarkUrl: sanityConfig?.logoDarkUrl || `${siteUrl}/images/rootgrain-logo-dark.svg`,
    logoEmailUrl: sanityConfig?.logoEmailUrl || sanityConfig?.logoUrl || `${siteUrl}/images/rootgrain-logo.png`,
    logoSquareUrl: sanityConfig?.logoSquareUrl || `${siteUrl}/images/logo-new.png`,
    faviconUrl: sanityConfig?.faviconUrl || `${siteUrl}/images/logo-new.png`,
    ogImageUrl: sanityConfig?.ogImageUrl || `${siteUrl}/images/hero-workshop.png`,
    support: {
      phone: parsePhone(rawPhone),
      email: sanityConfig?.email || "",
      hours: sanityConfig?.hours || "",
    },
    address: {
      line1: sanityConfig?.address?.line1 || "",
      line2: sanityConfig?.address?.line2 || "",
    },
    social: {
      instagram: sanityConfig?.socialLinks?.instagram,
      facebook: sanityConfig?.socialLinks?.facebook,
      twitter: sanityConfig?.socialLinks?.twitter,
      youtube: sanityConfig?.socialLinks?.youtube,
      linkedin: sanityConfig?.socialLinks?.linkedin,
      pinterest: sanityConfig?.socialLinks?.pinterest,
    },
    legal: {
      copyright: sanityConfig?.copyright || "",
      origin: sanityConfig?.origin || "",
    },
    categoryGroups
  };
}
