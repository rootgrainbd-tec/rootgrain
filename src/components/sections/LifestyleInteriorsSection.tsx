"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export function LifestyleInteriorsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      className="py-24 lg:py-32 bg-[var(--ivory)]"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="text-[var(--gold)] text-sm tracking-[0.4em] uppercase font-medium mb-4 block">
            Living with RootGrain
          </span>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-[var(--walnut-dark)] font-light mb-6">
            Lifestyle Interiors
          </h2>
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent mx-auto mb-8" />
          <p className="text-[var(--walnut-light)] text-lg max-w-2xl mx-auto leading-relaxed">
            Our furniture finds its home in spaces that value authenticity, warmth, 
            and the quiet luxury of natural materials.
          </p>
        </motion.div>

        {/* Large Image */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1 }}
          className="relative aspect-[21/9] overflow-hidden mb-8"
        >
          <Image
            src="/images/lifestyle-interior.png"
            alt="RootGrain furniture in a warm Japandi-style interior"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--walnut-dark)]/30 to-transparent" />
          <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between">
            <div>
              <p className="text-[var(--ivory)]/70 text-sm tracking-wider uppercase mb-2">Featured Space</p>
              <p className="font-serif text-2xl text-[var(--ivory)]">A Japandi Dining Room</p>
            </div>
            <Button className="bg-[var(--ivory)] text-[var(--walnut-dark)] hover:bg-[var(--gold)] rounded-none px-6 py-4 text-sm tracking-wider uppercase">
              Explore Spaces
            </Button>
          </div>
        </motion.div>

        {/* Two Column Images */}
        <div className="grid md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative aspect-[4/3] overflow-hidden group cursor-pointer"
          >
            <Image
              src="/images/craft-finishing.png"
              alt="Artisan finishing process"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-[var(--walnut-dark)]/0 group-hover:bg-[var(--walnut-dark)]/20 transition-colors duration-500" />
            <div className="absolute bottom-6 left-6">
              <p className="font-serif text-xl text-[var(--ivory)]">The Finishing Touch</p>
              <p className="text-[var(--ivory)]/70 text-sm mt-1">Hand-rubbed oil finishes</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative aspect-[4/3] overflow-hidden group cursor-pointer"
          >
            <Image
              src="/images/product-decor.png"
              alt="Artisan home decor pieces"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-[var(--walnut-dark)]/0 group-hover:bg-[var(--walnut-dark)]/20 transition-colors duration-500" />
            <div className="absolute bottom-6 left-6">
              <p className="font-serif text-xl text-[var(--ivory)]">Artisan Decor</p>
              <p className="text-[var(--ivory)]/70 text-sm mt-1">Handcrafted home accessories</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
