"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export function MaterialPhilosophySection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      id="philosophy"
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
            Our Materials
          </span>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-[var(--walnut-dark)] font-light mb-6">
            Material Philosophy
          </h2>
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent mx-auto mb-8" />
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="relative order-2 lg:order-1"
          >
            <div className="relative aspect-square overflow-hidden">
              <Image
                src="/images/material-wood-grain.png"
                alt="Premium hardwood grain detail"
                fill
                className="object-cover"
              />
            </div>
            {/* Accent */}
            <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-[var(--parchment)] -z-10" />
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="order-1 lg:order-2"
          >
            <div className="space-y-8">
              <div>
                <h3 className="font-serif text-2xl text-[var(--walnut-dark)] mb-3">
                  Premium Hardwoods
                </h3>
                <p className="text-[var(--walnut-light)] leading-relaxed">
                  We work exclusively with sustainably sourced American Black Walnut, 
                  White Oak, Cherry, and Maple—hardwoods chosen for their exceptional 
                  beauty, durability, and ability to develop rich patinas over time. 
                  Each board is hand-selected for its unique grain story.
                </p>
              </div>

              <div>
                <h3 className="font-serif text-2xl text-[var(--walnut-dark)] mb-3">
                  Natural Finishes
                </h3>
                <p className="text-[var(--walnut-light)] leading-relaxed">
                  Our furniture is finished with food-safe linseed oil and beeswax, 
                  allowing the wood to breathe and develop character with age. Unlike 
                  polyurethane, these natural finishes can be refreshed and renewed, 
                  ensuring your piece grows more beautiful with each passing year.
                </p>
              </div>

              <div>
                <h3 className="font-serif text-2xl text-[var(--walnut-dark)] mb-3">
                  Aging Gracefully
                </h3>
                <p className="text-[var(--walnut-light)] leading-relaxed">
                  We embrace the natural aging process of wood—the way cherry darkens 
                  to rich red-brown, how walnut deepens in color, the gentle wear 
                  patterns that tell the story of a life well-lived. These are not 
                  flaws to be feared, but the authentic marks of time that transform 
                  furniture into family heirlooms.
                </p>
              </div>

              <div className="pt-4">
                <Button
                  variant="outline"
                  className="border-[var(--walnut)] text-[var(--walnut)] hover:bg-[var(--walnut)] hover:text-[var(--ivory)] px-6 py-5 rounded-none text-sm tracking-wider uppercase"
                >
                  Learn About Our Woods
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
