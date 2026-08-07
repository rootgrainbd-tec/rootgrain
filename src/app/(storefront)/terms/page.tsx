import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { getSiteConfig } from "@/data/site-config";

export const metadata = {
  title: "Terms of Service | RootGrain",
  description: "Terms and conditions for using the RootGrain website and purchasing our handcrafted furniture.",
};

export default async function TermsPage() {
  const SITE_CONFIG = await getSiteConfig();

  return (
    <main className="min-h-screen bg-[var(--ivory)]">
      <Navigation config={SITE_CONFIG} />

      <div className="max-w-3xl mx-auto px-6 lg:px-8 pt-40 pb-24">
        <h1 className="font-serif text-4xl text-[var(--walnut-dark)] mb-8">Terms of Service</h1>

        <div className="prose prose-stone max-w-none text-[var(--walnut)] space-y-6">
          <p className="text-sm text-[var(--walnut-light)]">Last updated: July 2026</p>

          <h2 className="font-serif text-xl text-[var(--walnut-dark)]">1. Overview</h2>
          <p>Welcome to RootGrain. By accessing or using our website (rootgrain.com), you agree to be bound by these Terms of Service. If you do not agree, please do not use our services.</p>

          <h2 className="font-serif text-xl text-[var(--walnut-dark)]">2. Products & Pricing</h2>
          <p>All products displayed on our website are handcrafted furniture pieces. Prices are listed in Bangladeshi Taka (BDT). We reserve the right to change prices without prior notice. Colors and textures may vary slightly from images due to the natural properties of wood.</p>

          <h2 className="font-serif text-xl text-[var(--walnut-dark)]">3. Orders & Payments</h2>
          <p>When you place an order, you agree to pay a 20% advance of the total bill. Our representative will contact you with payment instructions. Orders are confirmed only upon receipt of the advance payment. The remaining balance is payable on delivery (Cash on Delivery).</p>

          <h2 className="font-serif text-xl text-[var(--walnut-dark)]">4. Shipping & Delivery</h2>
          <p>We deliver across Bangladesh. Delivery charges vary by district and are calculated at checkout. Delivery timelines depend on the product (handcrafted items may take 2-6 weeks for production). We will keep you informed of your order status.</p>

          <h2 className="font-serif text-xl text-[var(--walnut-dark)]">5. Returns & Refunds</h2>
          <p>Due to the handcrafted nature of our products, we do not accept returns for change of mind. If a product arrives damaged or defective, please contact us within 48 hours of delivery with photographic evidence. We will arrange a replacement or refund at our discretion.</p>

          <h2 className="font-serif text-xl text-[var(--walnut-dark)]">6. Cancellations</h2>
          <p>Orders may be cancelled before production begins. Once production has started, cancellation is not possible. The advance payment is non-refundable if cancellation is requested after production has commenced.</p>

          <h2 className="font-serif text-xl text-[var(--walnut-dark)]">7. Intellectual Property</h2>
          <p>All content on this website — including images, text, logos, and designs — is the property of RootGrain and may not be reproduced without written permission.</p>

          <h2 className="font-serif text-xl text-[var(--walnut-dark)]">8. Contact</h2>
          <p>For any questions regarding these terms, please contact us through our website or WhatsApp.</p>
        </div>
      </div>

      <Footer config={SITE_CONFIG} />
    </main>
  );
}
