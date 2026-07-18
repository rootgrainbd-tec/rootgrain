/** Centralized site configuration. One object, one source of truth. */
export interface SiteConfig {
  name: string;
  tagline: string;
  description: string;
  url: string;
  support: {
    /** Primary support phone */
    phone: {
      raw: string;
      display: string;
      tel: string;
      whatsapp: string;
    };
    email: string;
    hours: string;
  };
  address: {
    line1: string;
    line2: string;
  };
  social: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };
  legal: {
    copyright: string;
    origin: string;
  };
  categoryGroups?: {
    id: string;
    label: string;
    slug: string;
    categories: string[];
  }[];
}
