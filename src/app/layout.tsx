import type { Metadata } from "next";
import { Inter, Cormorant_Garamond, Crimson_Pro } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

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
    icon: "/images/logo-crest.png",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${cormorant.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
