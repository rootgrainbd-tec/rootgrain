"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";

export function WorkshopStorySection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      id="workshop"
      ref={ref}
      className="py-24 lg:py-32 bg-[var(--walnut-dark)] text-[var(--ivory)]"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <span className="text-[var(--gold)] text-sm tracking-[0.4em] uppercase font-medium mb-4 block">
              Our Story
            </span>
            <h2 className="font-serif text-4xl md:text-5xl font-light mb-8 leading-tight">
              Where Tradition
              <br />
              <span className="italic">Meets Tomorrow</span>
            </h2>
            <div className="w-24 h-px bg-gradient-to-r from-[var(--gold)] to-transparent mb-8" />
            
            <div className="space-y-6 text-[var(--ivory)]/80 leading-relaxed">
              <p>
                In a sunlit workshop nestled among old-growth forests, our artisans continue 
                a tradition that spans generations. Here, the scent of fresh-cut hardwood mingles 
                with the quiet rhythm of hand tools, and each piece of furniture begins its 
                journey from raw timber to heirloom treasure.
              </p>
              <p>
                Every RootGrain piece carries the marks of its makers—the careful selection of 
                grain, the patient hours of sanding, the precision of hand-cut joints. These are 
                not imperfections; they are the signatures of authenticity, proof that human 
                hands guided every step of creation.
              </p>
              <p>
                We believe that in an age of disposable goods, there is profound value in 
                furniture designed to outlive its makers. Each table, chair, and bench we 
                create is built to become a cherished part of your family's story, passed 
                down through generations as a testament to enduring quality.
              </p>
            </div>

            <div className="mt-10 flex flex-wrap gap-8">
              <div>
                <div className="font-serif text-4xl text-[var(--gold)]">25+</div>
                <div className="text-sm text-[var(--ivory)]/60 mt-1">Years of Heritage</div>
              </div>
              <div>
                <div className="font-serif text-4xl text-[var(--gold)]">12</div>
                <div className="text-sm text-[var(--ivory)]/60 mt-1">Master Artisans</div>
              </div>
              <div>
                <div className="font-serif text-4xl text-[var(--gold)]">3,000+</div>
                <div className="text-sm text-[var(--ivory)]/60 mt-1">Heirlooms Created</div>
              </div>
            </div>
          </motion.div>

          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative aspect-[4/5] overflow-hidden">
              <Image
                src="/images/workshop-interior.png"
                alt="RootGrain Workshop"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--walnut-dark)]/60 to-transparent" />
            </div>
            {/* Decorative frame */}
            <div className="absolute -top-4 -left-4 w-full h-full border border-[var(--gold)]/30 -z-10" />
            <div className="absolute -bottom-4 -right-4 w-full h-full border border-[var(--gold)]/30 -z-10" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
