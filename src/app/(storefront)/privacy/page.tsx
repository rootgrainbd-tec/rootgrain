import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { getSiteConfig } from "@/data/site-config";

export const metadata = {
  title: "Privacy Policy | RootGrain",
  description: "How RootGrain collects, uses, and protects your personal information.",
};

export default async function PrivacyPage() {
  const SITE_CONFIG = await getSiteConfig();

  return (
    <main className="min-h-screen bg-[var(--ivory)]">
      <Navigation config={SITE_CONFIG} />

      <div className="max-w-3xl mx-auto px-6 lg:px-8 pt-40 pb-24">
        <h1 className="font-serif text-4xl text-[var(--walnut-dark)] mb-8">Privacy Policy</h1>

        <div className="prose prose-stone max-w-none text-[var(--walnut)] space-y-6">
          <p className="text-sm text-[var(--walnut-light)]">Last updated: July 2026</p>

          <h2 className="font-serif text-xl text-[var(--walnut-dark)]">1. Information We Collect</h2>
          <p>We collect the following information when you use our website:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Name, phone number, and email address (when you create an account or place an order)</li>
            <li>Delivery address (when you place an order)</li>
            <li>Browsing data and cookies for website functionality</li>
            <li>Email address (when you subscribe to our newsletter)</li>
          </ul>

          <h2 className="font-serif text-xl text-[var(--walnut-dark)]">2. How We Use Your Information</h2>
          <p>Your information is used to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Process and fulfill your orders</li>
            <li>Communicate order updates and delivery status</li>
            <li>Send promotional emails (only if you subscribed)</li>
            <li>Improve our website and services</li>
          </ul>

          <h2 className="font-serif text-xl text-[var(--walnut-dark)]">3. Data Sharing</h2>
          <p>We do not sell or rent your personal information to third parties. We may share your data with delivery partners solely for the purpose of fulfilling your order.</p>

          <h2 className="font-serif text-xl text-[var(--walnut-dark)]">4. Data Security</h2>
          <p>We implement industry-standard security measures to protect your personal information. However, no method of transmission over the internet is 100% secure.</p>

          <h2 className="font-serif text-xl text-[var(--walnut-dark)]">5. Cookies</h2>
          <p>We use cookies to store your cart items and session information. These cookies are essential for the website to function properly.</p>

          <h2 className="font-serif text-xl text-[var(--walnut-dark)]">6. Your Rights</h2>
          <p>You may request deletion of your account and personal data by contacting us. We will process your request within 30 days.</p>

          <h2 className="font-serif text-xl text-[var(--walnut-dark)]">7. Contact</h2>
          <p>For privacy-related questions, please contact us through our website or email.</p>
        </div>
      </div>

      <Footer config={SITE_CONFIG} />
    </main>
  );
}
