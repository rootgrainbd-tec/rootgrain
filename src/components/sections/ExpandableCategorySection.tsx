"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Product, PRODUCT_CATEGORY_LABELS, formatPrice } from "@/types/product";

export function ExpandableCategorySection({ 
  products,
  tabGroups 
}: { 
  products: Product[],
  tabGroups: { id: string, label: string, slug: string, categories: string[] }[]
}) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  // If a group is active, filter by that group. Otherwise, show top 6 products as default.
  const currentGroup = tabGroups.find(g => g.id === activeGroup);
  
  const filteredProducts = currentGroup 
    ? products.filter(p => {
        const legacyLabel = PRODUCT_CATEGORY_LABELS[p.category] || p.category;
        return currentGroup.categories.includes(legacyLabel);
      }).slice(0, 6)
    : products.slice(0, 6); 

  return (
    <section id="house-and-home" className="py-24 lg:py-32 bg-[var(--ivory)] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-24">
          
          {/* Left Side: Expandable Menu */}
          <div className="lg:w-1/4 shrink-0">
            <div className="sticky top-32">
              <span className="text-[var(--gold)] text-xs tracking-[0.4em] uppercase font-medium mb-4 block">
                Discover
              </span>
              
              <div 
                className="group cursor-pointer border-b border-[var(--walnut-light)]/20 pb-4 mb-4"
                onMouseEnter={() => setIsExpanded(true)}
                onMouseLeave={() => setIsExpanded(false)}
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-2xl lg:text-3xl text-[var(--walnut-dark)]">
                    House & Home
                  </h2>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="w-6 h-6 text-[var(--walnut)]" />
                  </motion.div>
                </div>
                
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="pt-6 flex flex-col gap-4">
                        {tabGroups.map((group) => (
                          <button
                            key={group.id}
                            onMouseEnter={() => setActiveGroup(group.id)}
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/collection/${group.slug}`);
                            }}
                            className={`text-left text-sm tracking-widest uppercase transition-colors duration-300 ${
                              activeGroup === group.id 
                                ? "text-[var(--gold)] font-medium" 
                                : "text-[var(--walnut-light)] hover:text-[var(--walnut-dark)]"
                            }`}
                          >
                            {group.label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Right Side: Product Grid */}
          <div className="flex-1">
            <motion.div 
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 min-h-[400px]"
            >
              <AnimatePresence mode="wait">
                {filteredProducts.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="col-span-full flex items-center justify-center py-20 text-[var(--walnut-light)]"
                  >
                    No products found in this category.
                  </motion.div>
                ) : (
                  filteredProducts.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ duration: 0.3, delay: index * 0.04 }}
                      className="group cursor-pointer flex flex-col"
                    >
                      <div className="relative aspect-[4/5] overflow-hidden mb-4 bg-[var(--parchment)]">
                        <Image
                          src={product.image || "/placeholder.jpg"}
                          alt={product.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <Link href={`/product/${product.slug}`} className="absolute inset-0 z-10">
                          <span className="sr-only">View Details</span>
                        </Link>
                        <div className="absolute inset-0 bg-[var(--walnut-dark)]/0 group-hover:bg-[var(--walnut-dark)]/10 transition-colors duration-500" />
                        <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                          <Button className="w-full bg-[var(--ivory)] text-[var(--walnut-dark)] hover:bg-[var(--gold)] rounded-none py-4 text-xs tracking-wider uppercase">
                            View Details
                          </Button>
                        </div>
                      </div>
                      <Link href={`/product/${product.slug}`} className="flex flex-col flex-grow">
                        <span className="text-[var(--gold)] text-[10px] tracking-[0.2em] uppercase mb-1">
                          {PRODUCT_CATEGORY_LABELS[product.category] || product.category}
                        </span>
                        <h3 className="font-serif text-lg text-[var(--walnut-dark)] mb-2 group-hover:text-[var(--oxblood)] transition-colors line-clamp-1">
                          {product.name}
                        </h3>
                        <div className="mt-auto flex items-center justify-between text-sm">
                          <span className="text-[var(--walnut)] text-xs">{product.wood}</span>
                          <span className="font-serif text-base text-[var(--walnut-dark)]">{formatPrice(product.price)}</span>
                        </div>
                      </Link>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
