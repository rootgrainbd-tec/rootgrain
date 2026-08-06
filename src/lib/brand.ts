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
}
