"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, User, Search, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { NAV_LINKS } from "@/data/site-config";
import type { SiteConfig } from "@/types/site";
import { PRODUCT_CATEGORIES } from "@/types/product";

export function Navigation({ config }: { config: SiteConfig }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);

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
          <div className="flex items-center justify-between h-24">
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-2">
              <Link href="/" className="relative w-28 h-28 shrink-0">
                <Image
                  src="/images/logo-new.png"
                  alt="RootGrain Logo"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </Link>
              <Link href="/" className="flex flex-col justify-center group">
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
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8 h-full">
              {NAV_LINKS.map((link) => {
                if (link.label === "Collection") {
                  return (
                    <div 
                      key={link.href} 
                      className="relative h-full flex items-center"
                      onMouseEnter={() => setHoveredNav(link.label)}
                      onMouseLeave={() => setHoveredNav(null)}
                    >
                      <Link
                        href={link.href}
                        className={`text-sm font-medium tracking-wide transition-colors hover:text-[var(--gold)] ${
                          isScrolled ? "text-[var(--walnut)]" : "text-[var(--ivory)]"
                        }`}
                      >
                        {link.label}
                      </Link>
                      
                      {/* Dropdown Menu */}
                      <AnimatePresence>
                        {hoveredNav === "Collection" && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.2 }}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 mt-8 pt-6 pb-2 w-64"
                          >
                            <div className="bg-[var(--cream)] border border-[var(--walnut-light)]/20 shadow-xl shadow-[var(--walnut-dark)]/5 flex flex-col py-4">
                              <Link 
                                href="/collection"
                                className="px-6 py-2 text-sm text-[var(--walnut)] hover:text-[var(--gold)] hover:bg-[var(--parchment)] transition-colors"
                                onClick={() => setHoveredNav(null)}
                              >
                                View Complete Catalog
                              </Link>
                              <div className="h-px bg-[var(--walnut-light)]/20 my-2 mx-4" />
                              {PRODUCT_CATEGORIES.slice(1).map((category) => (
                                <Link
                                  key={category}
                                  href={`/collection?category=${encodeURIComponent(category)}`}
                                  className="px-6 py-2 text-sm text-[var(--walnut-light)] hover:text-[var(--gold)] hover:bg-[var(--parchment)] transition-colors block"
                                  onClick={() => setHoveredNav(null)}
                                >
                                  {category}
                                </Link>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                }

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-sm font-medium tracking-wide transition-colors hover:text-[var(--gold)] flex items-center h-full ${
                      isScrolled ? "text-[var(--walnut)]" : "text-[var(--ivory)]"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* Icons */}
            <div className="flex items-center gap-4 lg:gap-6">
              <button className={`hidden lg:block hover:text-[var(--gold)] transition-colors ${isScrolled ? "text-[var(--walnut)]" : "text-[var(--ivory)]"}`}>
                <User className="w-5 h-5" strokeWidth={1.5} />
              </button>
              <button className={`hover:text-[var(--gold)] transition-colors ${isScrolled ? "text-[var(--walnut)]" : "text-[var(--ivory)]"}`}>
                <Search className="w-5 h-5" strokeWidth={1.5} />
              </button>
              <button className={`relative hover:text-[var(--gold)] transition-colors ${isScrolled ? "text-[var(--walnut)]" : "text-[var(--ivory)]"}`}>
                <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />
                <span className={`absolute -top-2 -right-2 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center ${isScrolled ? 'bg-[var(--walnut)] text-[var(--ivory)]' : 'bg-[var(--ivory)] text-[var(--walnut-dark)]'}`}>
                  0
                </span>
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className={`lg:hidden p-2 ml-2 ${
                  isScrolled ? "text-[var(--walnut)]" : "text-[var(--ivory)]"
                }`}
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
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
