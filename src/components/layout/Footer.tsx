"use client";

import { useState } from "react";
import { Mail, MapPin, Phone, Clock, Instagram, Facebook, Twitter } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SiteConfig } from "@/types/site";

export function Footer({ config }: { config: SiteConfig }) {
  const [email, setEmail] = useState("");

  return (
    <footer id="contact" className="bg-[var(--walnut-dark)] text-[var(--ivory)]">
      {/* Newsletter Section */}
      <div className="border-b border-[var(--ivory)]/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="font-serif text-3xl mb-4">
                Join the RootGrain Circle
              </h3>
              <p className="text-[var(--ivory)]/70 max-w-md">
                Receive stories from our workshop, early access to new collections, 
                and insights into the art of fine woodworking.
              </p>
            </div>
            <div className="flex gap-4">
              <Input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent border-[var(--ivory)]/30 text-[var(--ivory)] placeholder:text-[var(--ivory)]/50 rounded-none py-6 focus:border-[var(--gold)]"
              />
              <Button className="bg-[var(--gold)] hover:bg-[var(--gold-light)] text-[var(--walnut-dark)] px-8 rounded-none whitespace-nowrap">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="relative w-16 h-16">
                <Image
                  src="/images/logo-crest.png?v=16"
                  alt="RootGrain Logo"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
              <div className="flex flex-col justify-center">
                <span className="font-serif text-xl font-semibold tracking-wide leading-tight text-[var(--ivory)]">{config.name.toUpperCase()}</span>
                <span className="text-xs tracking-[0.3em] uppercase leading-tight mt-0.5 text-[var(--ivory)]/60">
                  {config.tagline}
                </span>
              </div>
            </div>
            <p className="text-[var(--ivory)]/60 text-sm leading-relaxed mb-6">
              Handcrafted heirloom furniture for those who value authenticity, 
              craftsmanship, and the timeless beauty of natural wood.
            </p>
            <div className="flex gap-4">
              <a href={config.social.instagram ?? "#"} className="text-[var(--ivory)]/60 hover:text-[var(--gold)] transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href={config.social.facebook ?? "#"} className="text-[var(--ivory)]/60 hover:text-[var(--gold)] transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href={config.social.twitter ?? "#"} className="text-[var(--ivory)]/60 hover:text-[var(--gold)] transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-serif text-lg mb-6">Explore</h4>
            <ul className="space-y-3 text-[var(--ivory)]/60 text-sm">
              <li><a href="#collection" className="hover:text-[var(--gold)] transition-colors">Signature Collection</a></li>
              <li><a href="#craftsmanship" className="hover:text-[var(--gold)] transition-colors">Our Craftsmanship</a></li>
              <li><a href="#workshop" className="hover:text-[var(--gold)] transition-colors">Workshop Story</a></li>
              <li><a href="#philosophy" className="hover:text-[var(--gold)] transition-colors">Material Philosophy</a></li>
              <li><a href="#" className="hover:text-[var(--gold)] transition-colors">Custom Commissions</a></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-serif text-lg mb-6">Categories</h4>
            <ul className="space-y-3 text-[var(--ivory)]/60 text-sm">
              <li><a href="#" className="hover:text-[var(--gold)] transition-colors">Dining Tables</a></li>
              <li><a href="#" className="hover:text-[var(--gold)] transition-colors">Coffee Tables</a></li>
              <li><a href="#" className="hover:text-[var(--gold)] transition-colors">Chairs &amp; Seating</a></li>
              <li><a href="#" className="hover:text-[var(--gold)] transition-colors">Console Tables</a></li>
              <li><a href="#" className="hover:text-[var(--gold)] transition-colors">Home Decor</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-serif text-lg mb-6">Visit Our Atelier</h4>
            <ul className="space-y-4 text-[var(--ivory)]/60 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[var(--gold)] flex-shrink-0 mt-0.5" />
                <span>{config.address.line1}<br />{config.address.line2}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-[var(--gold)] flex-shrink-0" />
                <span>{config.support.phone}</span>
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
        <div className="border-t border-[var(--ivory)]/10 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[var(--ivory)]/40 text-sm">
            {config.legal.copyright} {config.legal.origin}
          </p>
          <div className="flex gap-8 text-[var(--ivory)]/40 text-sm">
            <a href="#" className="hover:text-[var(--ivory)] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[var(--ivory)] transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-[var(--ivory)] transition-colors">Care Guide</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
