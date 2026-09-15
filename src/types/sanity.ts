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
  woodTypes?: string[];
  dimensions?: SanityDimensions;
  heroImage?: SanityImage;
  heroVideo?: SanityMuxVideo;
  galleryImages?: SanityGalleryItem[];
  description?: string;
  shortDescription?: string;
  availability?: string;
  inStock?: boolean;
  featured?: boolean;
  cardPreview?: {
    previewType: "default" | "image" | "video";
    imageBehavior?: "fixed" | "slideshow";
    videoAutoplay?: boolean;
  };
  cardMedia?: import("./product").ProductCardMediaData;
}

export interface SanityMuxVideo {
  _type: "mux.video";
  asset: {
    playbackId: string;
    status?: string;
  };
}

export type SanityGalleryItem = SanityImage | SanityMuxVideo;

export interface SanityTestimonial {
  _id: string;
  quote: string;
  author: string;
  location: string;
  piece: string;
  approved: boolean;
}

export interface SanityStyledText {
  text?: string;
  fontSize?: string;
  textAlign?: string;
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
}

export interface SanityHomepage {
  _id: string;
  title?: string;
  subtitle?: string;
  heroText?: string;
  heroImage?: SanityImage;
  heroVideo?: SanityMuxVideo;
  heroHeadline?: SanityStyledText | string;
  heroSubheadline?: SanityStyledText | string;
  philosophyEyebrow?: string;
  philosophyTitle?: string;
  philosophyText?: import("next-sanity").PortableTextBlock[];
  philosophyImage?: SanityImage & { alt?: string };
  philosophyCtaLabel?: string;
  philosophyCtaUrl?: string;
  statsItems?: any[];
  lifestyleTitle?: string;
  lifestyleDescription?: string;
  lifestyleImage?: SanityImage;
  lifestyleVideo?: SanityMuxVideo;
  lifestyleSpace?: string;
  lifestyleCards?: Array<{
    image?: SanityImage & { alt?: string };
    title?: string;
    subtitle?: string;
  }>;
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

export interface SanityCraftsmanshipSection {
  _id: string;
  _type: "craftsmanshipSection";
  sectionEyebrow?: string;
  sectionTitle?: string;
  sectionDescription?: string;
  bannerImage?: any;
  bannerQuote?: string;
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
  workshopImage?: SanityImage;
  workshopVideo?: SanityMuxVideo;
}
