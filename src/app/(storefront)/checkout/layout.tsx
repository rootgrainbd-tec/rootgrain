import { getSiteConfig } from "@/data/site-config";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";

export default async function CheckoutLayout({ children }: { children: React.ReactNode }) {
  const SITE_CONFIG = await getSiteConfig();
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="print:hidden">
        <Navigation config={SITE_CONFIG} />
      </div>
      <div className="flex-1 pt-24 md:pt-32 print:pt-0">
        {children}
      </div>
      <div className="print:hidden">
        <Footer config={SITE_CONFIG} />
      </div>
    </div>
  );
}
