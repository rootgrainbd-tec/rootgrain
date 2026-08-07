import { getSiteConfig } from "@/data/site-config";
import { SmoothScroll } from "@/components/SmoothScroll";
import { NextAuthProvider } from "@/components/auth/NextAuthProvider";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { MaintenanceGuard } from "@/components/layout/MaintenanceGuard";
import { VerificationBanner } from "@/components/auth/VerificationBanner";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";

export default async function StorefrontLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const config = await getSiteConfig();

  return (
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
  );
}
