"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Product, PRODUCT_CATEGORY_LABELS, formatPrice } from "@/types/product";

export function SignatureCollectionSection({ products }: { products: Product[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      id="collection"
      ref={ref}
      className="py-24 lg:py-32 bg-[var(--ivory)]"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <span className="text-[var(--gold)] text-sm tracking-[0.4em] uppercase font-medium mb-4 block">
            Heirloom Quality
          </span>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-[var(--walnut-dark)] font-light mb-6">
            Signature Collection
          </h2>
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent mx-auto mb-8" />
          <p className="text-[var(--walnut-light)] text-lg max-w-2xl mx-auto leading-relaxed">
            Each piece in our signature collection represents the pinnacle of our craft—
            timeless designs that honor the natural beauty of premium hardwoods.
          </p>
        </motion.div>

        {/* Products Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product, index) => (
            <motion.div
              key={product.name}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group cursor-pointer"
            >
              <div className="relative aspect-[4/5] overflow-hidden mb-6 bg-[var(--parchment)]">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-[var(--walnut-dark)]/0 group-hover:bg-[var(--walnut-dark)]/10 transition-colors duration-500" />
                <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <Button className="w-full bg-[var(--ivory)] text-[var(--walnut-dark)] hover:bg-[var(--gold)] rounded-none py-4 text-sm tracking-wider uppercase">
                    View Details
                  </Button>
                </div>
              </div>
              <div>
                <span className="text-[var(--gold)] text-xs tracking-[0.2em] uppercase">
                  {PRODUCT_CATEGORY_LABELS[product.category]}
                </span>
                <h3 className="font-serif text-xl text-[var(--walnut-dark)] mt-1 mb-2 group-hover:text-[var(--oxblood)] transition-colors">
                  {product.name}
                </h3>
                <p className="text-[var(--walnut-light)] text-sm mb-3 line-clamp-2">
                  {product.description}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--walnut)]">{product.wood}</span>
                  <span className="font-serif text-lg text-[var(--walnut-dark)]">{formatPrice(product.price)}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View All CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-16"
        >
          <Button
            variant="outline"
            className="border-[var(--walnut)] text-[var(--walnut)] hover:bg-[var(--walnut)] hover:text-[var(--ivory)] px-8 py-6 rounded-none text-sm tracking-wider uppercase"
          >
            View Complete Collection
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
