"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { NAV_LINKS } from "@/data/site-config";
import type { SiteConfig } from "@/types/site";

export function Navigation({ config }: { config: SiteConfig }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? "bg-[var(--cream)]/95 backdrop-blur-md shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-48">
            {/* Logo */}
            <a href="#" className="flex items-center gap-2 group">
              <div className="relative w-36 h-36">
                <Image
                  src="/images/logo-crest.png?v=16"
                  alt="RootGrain Logo"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
              <div className="flex flex-col justify-center">
                <span className={`font-serif text-2xl font-semibold tracking-wide leading-tight ${
                  isScrolled ? "text-[var(--walnut)]" : "text-[var(--ivory)]"
                }`}>
                  {config.name.toUpperCase()}
                </span>
                <span className={`text-xs tracking-[0.3em] uppercase leading-tight mt-0.5 ${
                  isScrolled ? "text-[var(--walnut-light)]" : "text-[var(--ivory)]/70"
                }`}>
                  {config.tagline}
                </span>
              </div>
            </a>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium tracking-wide transition-colors hover:text-[var(--gold)] ${
                    isScrolled ? "text-[var(--walnut)]" : "text-[var(--ivory)]"
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* CTA Button */}
            <div className="hidden lg:block">
              <Button
                variant="outline"
                className={`border-2 rounded-none px-6 py-2 text-sm tracking-wider uppercase font-medium transition-all hover:bg-[var(--walnut)] hover:text-[var(--ivory)] hover:border-[var(--walnut)] ${
                  isScrolled
                    ? "border-[var(--walnut)] text-[var(--walnut)]"
                    : "border-[var(--ivory)] text-[var(--ivory)]"
                }`}
              >
                Visit Atelier
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className={`lg:hidden p-2 ${
                isScrolled ? "text-[var(--walnut)]" : "text-[var(--ivory)]"
              }`}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[var(--walnut-dark)]"
          >
            <div className="flex flex-col h-full p-6">
              <div className="flex justify-end">
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-[var(--ivory)] p-2"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex flex-col items-center justify-center flex-1 gap-8">
                {NAV_LINKS.map((link, index) => (
                  <motion.a
                    key={link.href}
                    href={link.href}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="font-serif text-3xl text-[var(--ivory)] hover:text-[var(--gold)] transition-colors"
                  >
                    {link.label}
                  </motion.a>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
