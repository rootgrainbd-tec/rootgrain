"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Product, PRODUCT_CATEGORIES, PRODUCT_CATEGORY_LABELS, formatPrice } from "@/types/product";

import Link from "next/link";

export function CollectionClient({ 
  initialProducts,
  title = "The Complete Collection",
  subtitle = "Our Catalog",
  allowedCategories = PRODUCT_CATEGORIES
}: { 
  initialProducts: Product[],
  title?: string,
  subtitle?: string,
  allowedCategories?: string[]
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");

  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Sync state with URL parameter on mount and when it changes
  useEffect(() => {
    requestAnimationFrame(() => {
      if (categoryParam && allowedCategories.includes(categoryParam)) {
        setSelectedCategory(categoryParam);
      } else {
        setSelectedCategory("All");
      }
    });
  }, [categoryParam]);

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    if (category === "All") {
      router.push("/collection", { scroll: false });
    } else {
      router.push(`/collection?category=${encodeURIComponent(category)}`, { scroll: false });
    }
  };

  const filteredProducts = selectedCategory === "All" 
    ? initialProducts 
    : initialProducts.filter(p => {
        const legacyLabel = PRODUCT_CATEGORY_LABELS[p.category] || p.category;
        return legacyLabel.toLowerCase() === selectedCategory.toLowerCase();
      });

  // Filter products by allowedCategories
  const allowedProducts = filteredProducts.filter(p => {
    const legacyLabel = PRODUCT_CATEGORY_LABELS[p.category] || p.category;
    return allowedCategories.includes(legacyLabel);
  });

  return (
    <section className="py-12 lg:py-24 bg-[var(--ivory)] min-h-screen">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-[var(--gold)] text-sm tracking-[0.4em] uppercase font-medium mb-4 block">
            {subtitle}
          </span>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-[var(--walnut-dark)] font-light mb-6">
            {title}
          </h1>
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent mx-auto" />
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Left Sidebar */}
          <aside className="lg:w-64 shrink-0">
            <div className="lg:sticky lg:top-32">
              <h3 className="font-serif text-xl text-[var(--walnut-dark)] mb-6">Categories</h3>
              
              {/* Mobile Scrollable row / Desktop vertical list */}
              <div className="flex lg:flex-col overflow-x-auto lg:overflow-visible gap-2 pb-4 lg:pb-0 hide-scrollbar">
                {["All", ...allowedCategories.filter(c => c !== "All")].map((category) => (
                  <button
                    key={category}
                    onClick={() => handleCategorySelect(category)}
                    className={`whitespace-nowrap text-left px-4 py-2 lg:px-0 lg:py-1.5 transition-colors duration-300 text-sm tracking-wide rounded-full lg:rounded-none border lg:border-none ${
                      selectedCategory === category
                        ? "text-[var(--gold)] border-[var(--gold)] lg:font-medium"
                        : "text-[var(--walnut-light)] border-[var(--walnut-light)]/20 hover:text-[var(--walnut-dark)]"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Right Product Grid */}
          <main className="flex-1">
            {allowedProducts.length === 0 ? (
              <div className="text-center py-20 text-[var(--walnut-light)]">
                <p>No products found in this category.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                {allowedProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="group cursor-pointer"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden mb-6 bg-[var(--parchment)]">
                      <Image
                        src={product.image || "/placeholder.jpg"}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                        <Link href={`/product/${product.slug}`} className="absolute inset-0 z-10">
                          <span className="sr-only">View Details</span>
                        </Link>
                        <div className="absolute inset-0 bg-[var(--walnut-dark)]/0 group-hover:bg-[var(--walnut-dark)]/10 transition-colors duration-500" />
                        <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                          <Button className="w-full bg-[var(--ivory)] text-[var(--walnut-dark)] hover:bg-[var(--gold)] rounded-none py-4 text-sm tracking-wider uppercase">
                            View Details
                          </Button>
                        </div>
                      </div>
                      <Link href={`/product/${product.slug}`}>
                      <span className="text-[var(--gold)] text-xs tracking-[0.2em] uppercase">
                        {PRODUCT_CATEGORY_LABELS[product.category] || product.category}
                      </span>
                      <h3 className="font-serif text-xl text-[var(--walnut-dark)] mt-1 mb-2 group-hover:text-[var(--oxblood)] transition-colors">
                        {product.name}
                      </h3>
                      <div className="flex items-center justify-between text-sm mt-3">
                        <span className="text-[var(--walnut)]">{product.wood}</span>
                        <span className="font-serif text-lg text-[var(--walnut-dark)]">{formatPrice(product.price)}</span>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </main>

        </div>
      </div>
    </section>
  );
}
