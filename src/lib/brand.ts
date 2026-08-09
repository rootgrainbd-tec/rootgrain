import type { SiteConfig } from "@/types/site";
import { getSiteConfig } from "@/data/site-config";

export class BrandService {
  private config: SiteConfig;

  constructor(config: SiteConfig) {
    this.config = config;
  }

  /**
   * Initialize the BrandService asynchronously (Server Components).
   */
  static async init(): Promise<BrandService> {
    const config = await getSiteConfig();
    return new BrandService(config);
  }

  getBrand(): SiteConfig {
    return this.config;
  }

  getLogo(): string {
    return this.config.logoUrl || "/images/rootgrain-logo.svg";
  }

  getDarkLogo(): string {
    return this.config.logoDarkUrl || "/images/rootgrain-logo-dark.svg";
  }

  getEmailLogo(): string {
    return this.config.logoEmailUrl || this.config.logoUrl || "/images/rootgrain-logo.png";
  }
  
  getSquareLogo(): string {
    return this.config.logoSquareUrl || "/images/logo-new.png";
  }

  getFavicon(): string {
    return this.config.faviconUrl || "/images/logo-new.png";
  }

  getOgImage(): string {
    return this.config.ogImageUrl || "/images/hero-workshop.png";
  }

  getCompanyName(): string {
    return this.config.name || "RootGrain";
  }

  getSiteName(): string {
    return this.config.name || "RootGrain";
  }

  getBrandDescription(): string {
    return this.config.description || "Handcrafted heirloom furniture for those who value authenticity, craftsmanship, and the timeless beauty of natural wood.";
  }

  getSeoTitle(): string {
    return this.config.seo?.seoTitle || `${this.getSiteName()} | Heritage Artisan Furniture`;
  }

  getSeoDescription(): string {
    return this.config.seo?.seoDescription || "RootGrain crafts heirloom-quality wooden furniture using time-honored artisan techniques. Each piece tells a story of craftsmanship, permanence, and timeless beauty.";
  }
}
