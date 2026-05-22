"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Quote } from "lucide-react";
import type { Testimonial } from "@/types/content";

export function TestimonialsSection({ testimonials }: { testimonials: Testimonial[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      className="py-24 lg:py-32 bg-[var(--parchment)]"
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
            Words From Our Collectors
          </span>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-[var(--walnut-dark)] font-light mb-6">
            Testimonials
          </h2>
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent mx-auto" />
        </motion.div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.author}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="p-8 bg-[var(--ivory)] border border-[var(--border)] relative"
            >
              <Quote className="absolute top-6 right-6 w-10 h-10 text-[var(--gold)]/20" />
              <p className="text-[var(--walnut)] leading-relaxed mb-6 italic">
                &quot;{testimonial.quote}&quot;
              </p>
              <div className="border-t border-[var(--border)] pt-6">
                <p className="font-serif text-lg text-[var(--walnut-dark)]">
                  {testimonial.author}
                </p>
                <p className="text-sm text-[var(--walnut-light)] mt-1">
                  {testimonial.location}
                </p>
                <p className="text-xs text-[var(--gold)] mt-2 tracking-wider uppercase">
                  {testimonial.piece}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
