"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";
import { CRAFT_PROCESSES } from "@/data/crafts";

import { urlForImage } from "../../../../sanity/lib/image";
import { Hammer } from "lucide-react";

export function CraftsmanshipSection({ steps }: { steps?: any[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const displaySteps = steps?.length ? steps : CRAFT_PROCESSES;

  return (
    <section
      id="craftsmanship"
      ref={ref}
      className="py-24 lg:py-32 bg-[var(--cream)] grain-overlay"
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
            The Art of Making
          </span>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-[var(--walnut-dark)] font-light mb-6">
            Craftsmanship
          </h2>
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent mx-auto mb-8" />
          <p className="text-[var(--walnut-light)] text-lg max-w-2xl mx-auto leading-relaxed">
            Our furniture is born from patience, skill, and an unwavering commitment 
            to the traditions of fine woodworking. Each piece passes through the hands 
            of master craftsmen who have dedicated their lives to this ancient art.
          </p>
        </motion.div>

        {/* Crafts Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displaySteps.map((craft, index) => {
            const Icon = craft.icon || Hammer;
            return (
              <motion.div
                key={craft.title}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group p-8 bg-[var(--ivory)] border border-[var(--border)] hover:border-[var(--gold)] transition-all duration-500 hover-lift"
              >
                <div className="text-[var(--gold)] mb-6 group-hover:scale-110 transition-transform duration-500">
                  <Icon className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-2xl text-[var(--walnut-dark)] mb-4">
                  {craft.title}
                </h3>
                <p className="text-[var(--walnut-light)] leading-relaxed">
                  {craft.description}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Image */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 0.6 }}
          className="mt-20 relative aspect-[21/9] overflow-hidden"
        >
          <Image
            src="/images/craftsmanship-detail.png"
            alt="Artisan hands at work"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--walnut-dark)]/40 to-transparent" />
          <div className="absolute bottom-8 left-8 right-8">
            <p className="font-serif text-2xl text-[var(--ivory)] max-w-xl">
              "The hand that shapes the wood leaves its mark on the soul of the piece."
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
