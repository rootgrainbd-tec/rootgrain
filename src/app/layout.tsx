import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";

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

export const metadata: Metadata = {
  metadataBase: new URL("https://rootgrain.com"),
  title: "RootGrain | Heritage Artisan Furniture",
  description: "RootGrain crafts heirloom-quality wooden furniture using time-honored artisan techniques. Each piece tells a story of craftsmanship, permanence, and timeless beauty.",
  keywords: ["handcrafted furniture", "artisan furniture", "wooden furniture", "heritage furniture", "luxury furniture", "dining tables", "coffee tables", "woodworking"],
  authors: [{ name: "RootGrain Atelier" }],
  icons: {
    icon: "/images/logo-new.png",
  },
  openGraph: {
    title: "RootGrain | Heritage Artisan Furniture",
    description: "Handcrafted heirloom-quality wooden furniture. Crafted with legacy, not mass manufactured.",
    url: "https://rootgrain.com",
    siteName: "RootGrain",
    type: "website",
    images: [
      {
        url: "/images/hero-workshop.png",
        width: 1344,
        height: 768,
        alt: "RootGrain Artisan Workshop",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RootGrain | Heritage Artisan Furniture",
    description: "Handcrafted heirloom-quality wooden furniture. Crafted with legacy, not mass manufactured.",
    images: ["/images/hero-workshop.png"],
  },
};

import { SmoothScroll } from "@/components/SmoothScroll";
import { AuthProviders } from "@/components/auth/Providers";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { MaintenanceGuard } from "@/components/layout/MaintenanceGuard";
import { VerificationBanner } from "@/components/auth/VerificationBanner";
import Script from "next/script";

import { getSiteConfig } from "@/data/site-config";

export default async function RootLayout({
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
      <body
        className={`${inter.variable} ${cormorant.variable} antialiased bg-background text-foreground`}
      >
        <AuthProviders>
          <SmoothScroll>
            <MaintenanceGuard>
              <VerificationBanner />
              {children}
            </MaintenanceGuard>
            <Toaster />
            <SonnerToaster position="bottom-right" richColors />
            <WhatsAppButton whatsappNumber={config.support.phone.whatsapp} />
          </SmoothScroll>
        </AuthProviders>
      </body>
    </html>
  );
}
