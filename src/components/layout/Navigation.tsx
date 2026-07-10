"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, User, Search, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { UserNav } from "@/components/layout/UserNav";
import { NAV_LINKS } from "@/data/site-config";
import type { SiteConfig } from "@/types/site";
import { CartSheet } from "./CartSheet";
import { SearchCommand } from "./SearchCommand";
import { usePathname } from "next/navigation";

export function Navigation({ config }: { config: SiteConfig }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const pathname = usePathname();
  const isDarkText = isScrolled || pathname !== "/";

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? "bg-[var(--cream)]/95 backdrop-blur-sm shadow-sm"
            : "bg-transparent"
        }`}
        style={{ willChange: isScrolled ? "backdrop-filter" : "auto" }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className={`flex items-center justify-between transition-all duration-500 ${isScrolled ? "h-16" : "h-28"}`}>
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-2 z-10 shrink-0">
              <Link href="/" className={`relative shrink-0 transition-all duration-500 ${isScrolled ? "w-[50px] h-[50px]" : "w-[90px] h-[90px] lg:w-[120px] lg:h-[120px]"}`}>
                <Image
                  src={isDarkText ? "/images/rootgrain-logo-dark.svg" : "/images/rootgrain-logo.svg"}
                  alt="RootGrain Logo"
                  fill
                  className="object-contain"
                />
              </Link>
              <Link href="/" className="flex flex-col justify-center group overflow-hidden">
                <span className={`font-serif font-semibold tracking-wide leading-tight transition-all duration-500 ${
                  isDarkText ? "text-xl text-[var(--walnut)]" : "text-2xl text-[var(--ivory)]"
                }`}>
                  {config.name.toUpperCase()}
                </span>
                <span className={`uppercase leading-tight transition-all duration-500 overflow-hidden ${
                  isDarkText ? "text-[0px] tracking-[0px] opacity-0 h-0" : "text-xs tracking-[0.3em] opacity-100 h-4 mt-0.5 text-[var(--ivory)]/70"
                }`}>
                  {config.tagline}
                </span>
              </Link>
            </div>

            {/* Desktop Navigation - Center */}
            <div className="hidden lg:flex flex-1 items-center justify-center gap-8 h-full px-8">
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
                          isDarkText ? "text-[var(--walnut)]" : "text-[var(--ivory)]"
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
                            <div className="bg-[var(--cream)]/90 backdrop-blur-sm border border-[var(--walnut-light)]/20 shadow-xl shadow-[var(--walnut-dark)]/5 flex flex-col py-4">
                              <Link 
                                href="/collection"
                                className="px-6 py-2 text-sm text-[var(--walnut)] hover:text-[var(--gold)] hover:bg-[var(--parchment)] transition-colors"
                                onClick={() => setHoveredNav(null)}
                              >
                                View Complete Catalog
                              </Link>
                              <div className="h-px bg-[var(--walnut-light)]/20 my-2 mx-4" />
                              {config.categoryGroups?.map((group) => (
                                <Link
                                  key={group.id}
                                  href={`/collection/${group.slug}`}
                                  className="px-6 py-2 text-sm text-[var(--walnut-light)] hover:text-[var(--gold)] hover:bg-[var(--parchment)] transition-colors block"
                                  onClick={() => setHoveredNav(null)}
                                >
                                  {group.label}
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
                      isDarkText ? "text-[var(--walnut)]" : "text-[var(--ivory)]"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* Icons - Right Side */}
            <div className="flex items-center gap-4 lg:gap-6 h-full shrink-0">
              <UserNav isScrolled={isDarkText} />
              <button 
                aria-label="Search" 
                onClick={() => setIsSearchOpen(true)}
                className={`hover:text-[var(--gold)] transition-colors ${isDarkText ? "text-[var(--walnut)]" : "text-[var(--ivory)]"}`}
              >
                <Search className="w-5 h-5" strokeWidth={1.5} />
              </button>
              <CartSheet isScrolled={isDarkText} />

              {/* Mobile Menu Button */}
              <button
                aria-label="Open Mobile Menu"
                onClick={() => setIsMobileMenuOpen(true)}
                className={`lg:hidden p-2 ml-2 ${
                  isDarkText ? "text-[var(--walnut)]" : "text-[var(--ivory)]"
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
      <SearchCommand open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </>
  );
}
