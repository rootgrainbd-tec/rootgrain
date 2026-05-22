/** Centralized site configuration. One object, one source of truth. */
export interface SiteConfig {
  name: string;
  tagline: string;
  description: string;
  url: string;
  support: {
    /** Primary support phone — 01305-993024 */
    phone: string;
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
}
