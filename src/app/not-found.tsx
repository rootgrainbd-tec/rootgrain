import Link from "next/link";
import Image from "next/image";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { getSiteConfig } from "@/data/site-config";
import { Button } from "@/components/ui/button";
import { BrandService } from "@/lib/brand";

export default async function NotFound() {
  const SITE_CONFIG = await getSiteConfig();
  const brand = new BrandService(SITE_CONFIG);

  return (
    <main className="min-h-screen bg-[var(--ivory)]">
      <Navigation config={SITE_CONFIG} />
      
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-40 pb-24 flex flex-col items-center justify-center text-center min-h-[70vh]">
        <div className="relative w-24 h-24 mb-8 opacity-30">
          <Image src={brand.getDarkLogo()} alt={brand.getCompanyName()} fill className="object-contain" />
        </div>
        
        <h1 className="font-serif text-7xl md:text-9xl text-[var(--walnut-dark)] font-light mb-4">
          404
        </h1>
        <h2 className="font-serif text-2xl md:text-3xl text-[var(--walnut)] mb-4">
          Page Not Found
        </h2>
        <p className="text-[var(--walnut-light)] max-w-md mb-10 leading-relaxed">
          The page you're looking for seems to have wandered off into the workshop. 
          Let us help you find your way back.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild className="bg-[var(--walnut-dark)] hover:bg-[var(--gold)] text-[var(--ivory)] px-8 py-6 rounded-none tracking-widest uppercase text-sm">
            <Link href="/">Go Home</Link>
          </Button>
          <Button asChild variant="outline" className="border-[var(--walnut-light)] text-[var(--walnut-dark)] hover:border-[var(--gold)] hover:text-[var(--gold)] px-8 py-6 rounded-none tracking-widest uppercase text-sm">
            <Link href="/collection">Browse Collection</Link>
          </Button>
        </div>
      </div>

      <Footer config={SITE_CONFIG} />
    </main>
  );
}
