import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "../globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

import { getSiteConfig } from "@/data/site-config";
import { BrandService } from "@/lib/brand";
import Script from "next/script";

import { SmoothScroll } from "@/components/SmoothScroll";
import { NextAuthProvider } from "@/components/auth/NextAuthProvider";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { MaintenanceGuard } from "@/components/layout/MaintenanceGuard";
import { VerificationBanner } from "@/components/auth/VerificationBanner";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig();
  const brand = new BrandService(config);

  return {
    metadataBase: new URL(config.url || "https://rootgrain.bd"),
    title: brand.getSeoTitle(),
    description: brand.getSeoDescription(),
    keywords: ["handcrafted furniture", "artisan furniture", "wooden furniture", "heritage furniture", "luxury furniture", "dining tables", "coffee tables", "woodworking"],
    authors: [{ name: `${brand.getCompanyName()} Atelier` }],
    icons: {
      icon: brand.getFavicon(),
      apple: brand.getFavicon(),
    },
    manifest: "/site.webmanifest",
    openGraph: {
      title: brand.getSeoTitle(),
      description: brand.getSeoDescription(),
      url: config.url || "https://rootgrain.bd",
      siteName: brand.getSiteName(),
      type: "website",
      images: [
        {
          url: brand.getOgImage(),
          width: 1344,
          height: 768,
          alt: `${brand.getCompanyName()} Artisan Workshop`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: brand.getSeoTitle(),
      description: brand.getSeoDescription(),
      images: [brand.getOgImage()],
    },
  };
}

export default async function StorefrontLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const config = await getSiteConfig();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google Analytics */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
            `}
          </Script>
        )}
        
        {/* Meta Pixel */}
        {process.env.NEXT_PUBLIC_META_PIXEL_ID && (
          <Script id="meta-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${process.env.NEXT_PUBLIC_META_PIXEL_ID}');
              fbq('track', 'PageView');
            `}
          </Script>
        )}
      </head>
      <body className={`${inter.variable} ${cormorant.variable} antialiased bg-background text-foreground`}>
        <NextAuthProvider>
          <SmoothScroll>
            <MaintenanceGuard>
              <VerificationBanner />
              {children}
            </MaintenanceGuard>
            <Toaster />
            <SonnerToaster position="bottom-right" richColors />
            <WhatsAppButton whatsappNumber={config.support.phone.whatsapp} />
          </SmoothScroll>
        </NextAuthProvider>
      </body>
    </html>
  );
}
