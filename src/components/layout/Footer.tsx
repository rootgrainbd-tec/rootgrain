"use client";

import { useState } from "react";
import { Mail, MapPin, Phone, Clock, Instagram, Facebook } from "lucide-react";
import Link from "next/link";

const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
  </svg>
);
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SiteConfig } from "@/types/site";
import { BrandService } from "@/lib/brand";

export function Footer({ config }: { config: SiteConfig }) {
  const brand = new BrandService(config);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubscribe = async () => {
    if (!email || !email.includes("@")) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage("Thank you for subscribing!");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.message || "Something went wrong.");
      }
    } catch (err) {
      setStatus("error");
      setMessage("Failed to subscribe.");
    }
  };

  return (
    <footer id="contact" className="bg-[var(--walnut-dark)] text-[var(--ivory)]">
      {/* Newsletter Section */}
      <div className="border-b border-[var(--ivory)]/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 md:py-10">
          <div className="grid lg:grid-cols-2 gap-6 md:gap-8 items-center">
            <div>
              <h3 className="font-serif text-3xl mb-4">
                Join the RootGrain Circle
              </h3>
              <p className="text-[var(--ivory)]/70 max-w-md">
                Receive stories from our workshop, early access to new collections, 
                and insights into the art of fine woodworking.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex gap-4">
                <Input
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={status === "loading"}
                  className="bg-transparent border-[var(--ivory)]/30 text-[var(--ivory)] placeholder:text-[var(--ivory)]/50 rounded-none py-6 focus:border-[var(--gold)]"
                />
                <Button 
                  onClick={handleSubscribe} 
                  disabled={status === "loading"}
                  className="bg-[var(--gold)] hover:bg-[var(--gold-light)] text-[var(--walnut-dark)] px-8 rounded-none whitespace-nowrap disabled:opacity-50"
                >
                  {status === "loading" ? "Subscribing..." : "Subscribe"}
                </Button>
              </div>
              {message && (
                <p className={`text-sm ${status === "error" ? "text-red-400" : "text-[var(--gold)]"}`}>
                  {message}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 md:py-10">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10 md:gap-8">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="relative w-[83px] h-[83px]">
                <Image
                  src={brand.getLogo()}
                  alt={`${brand.getCompanyName()} Logo`}
                  fill
                  className="object-contain"
                />
              </div>
              <div className="flex flex-col justify-center">
                <span className="font-serif text-xl font-semibold tracking-wide leading-tight text-[var(--ivory)]">{config.name.toUpperCase()}</span>
                <span className="text-xs tracking-[0.3em] uppercase leading-tight mt-0.5 text-[var(--ivory)]/60">
                  {config.tagline}
                </span>
              </div>
            </div>
            <p className="text-[var(--ivory)]/60 text-sm leading-relaxed mb-4">
              {brand.getBrandDescription()}
            </p>
            <div className="flex gap-4">
              <a aria-label="Instagram" href={config.social.instagram ?? "#"} className="text-[var(--ivory)]/60 hover:text-[var(--gold)] transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a aria-label="Facebook" href={config.social.facebook ?? "#"} className="text-[var(--ivory)]/60 hover:text-[var(--gold)] transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a aria-label="X" href={config.social.twitter ?? "#"} className="text-[var(--ivory)]/60 hover:text-[var(--gold)] transition-colors">
                <XIcon className="w-[18px] h-[18px] mt-0.5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-span-1">
            <h4 className="font-serif text-lg mb-4">Explore</h4>
            <ul className="space-y-3 text-[var(--ivory)]/60 text-sm">
              <li><Link href="/#collection" className="hover:text-[var(--gold)] transition-colors">Signature Collection</Link></li>
              <li><Link href="/#craftsmanship" className="hover:text-[var(--gold)] transition-colors">Our Craftsmanship</Link></li>
              <li><Link href="/#workshop" className="hover:text-[var(--gold)] transition-colors">Workshop Story</Link></li>
              <li><Link href="/#philosophy" className="hover:text-[var(--gold)] transition-colors">Material Philosophy</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div className="col-span-1">
            <h4 className="font-serif text-lg mb-4">Categories</h4>
            <ul className="space-y-3 text-[var(--ivory)]/60 text-sm">
              {config.categoryGroups?.map((group) => (
                <li key={group.id}>
                  <Link href={`/collection/${group.slug}`} className="hover:text-[var(--gold)] transition-colors">
                    {group.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="col-span-2 lg:col-span-1">
            <h4 className="font-serif text-lg mb-4">Visit Our Atelier</h4>
            <ul className="space-y-4 text-[var(--ivory)]/60 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[var(--gold)] flex-shrink-0 mt-0.5" />
                <span>{config.address.line1}<br />{config.address.line2}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-[var(--gold)] flex-shrink-0" />
                <a href={`tel:${config.support.phone.tel}`} className="hover:text-[var(--gold)] transition-colors">
                  {config.support.phone.display}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[var(--gold)] flex-shrink-0" />
                <span>{config.support.email}</span>
              </li>
              <li className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-[var(--gold)] flex-shrink-0" />
                <span>{config.support.hours}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[var(--ivory)]/10 mt-8 md:mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <p className="text-[var(--ivory)]/40 text-sm">
            {config.legal.copyright} {config.legal.origin}
          </p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[var(--ivory)]/40 text-sm">
            <Link href="/privacy" className="hover:text-[var(--ivory)] transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-[var(--ivory)] transition-colors">Terms of Service</Link>
            <a href="#" className="hover:text-[var(--ivory)] transition-colors">Care Guide</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
