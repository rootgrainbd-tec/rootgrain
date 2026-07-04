export interface SanitySlug {
  current: string;
}

export interface SanityImage {
  _type: "image";
  asset: {
    _ref: string;
    _type: "reference";
  };
}

export interface SanityDimensions {
  length: number;
  width: number;
  height: number;
  unit: string;
}

export interface SanityCategory {
  name: string;
}

export interface SanityProduct {
  _id: string;
  name: string;
  title?: string;
  slug?: SanitySlug;
  category?: SanityCategory;
  price: number;
  comparePrice?: number;
  wood?: string;
  woodType?: string;
  dimensions?: SanityDimensions;
  heroImage?: SanityImage;
  description?: string;
  shortDescription?: string;
  availability?: string;
  inStock?: boolean;
  featured?: boolean;
}

export interface SanityTestimonial {
  _id: string;
  quote: string;
  author: string;
  location: string;
  piece: string;
  approved: boolean;
}

export interface SanityHomepage {
  _id: string;
  title?: string;
  subtitle?: string;
  heroText?: string;
  heroImage?: SanityImage;
  heroHeadline?: string;
  heroSubheadline?: string;
  statsItems?: any[];
  lifestyleTitle?: string;
  lifestyleDescription?: string;
  lifestyleImage?: SanityImage;
  lifestyleSpace?: string;
}

export interface SanitySiteSettings {
  _id?: string;
  siteTitle?: string;
  tagline?: string;
  description?: string;
  phone?: string;
  email?: string;
  hours?: string;
  address?: {
    line1?: string;
    line2?: string;
  };
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };
  copyright?: string;
  origin?: string;
}

export interface SanityCraftsmanshipStep {
  _id?: string;
  title: string;
  description: string;
  order: number;
  icon?: any;
}

export interface SanityWorkshop {
  _id: string;
  title?: string;
  description?: string;
}
