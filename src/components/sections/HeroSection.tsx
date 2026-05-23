"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

import { urlForImage } from "../../../../sanity/lib/image";

export function HeroSection({ data }: { data?: any }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section ref={ref} className="relative h-screen min-h-[700px] overflow-hidden">
      {/* Background Image */}
      <motion.div style={{ y }} className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--walnut-dark)]/60 via-[var(--walnut-dark)]/40 to-[var(--cream)] z-10" />
        <Image
          src={data?.heroImage ? urlForImage(data.heroImage).url() : "/images/hero-workshop.png"}
          alt="RootGrain Artisan Workshop"
          fill
          className="object-cover"
          priority
        />
      </motion.div>

      {/* Content */}
      <motion.div
        style={{ opacity }}
        className="relative z-20 h-full flex flex-col items-center justify-center text-center px-6"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="mb-6"
        >
          <span className="text-[var(--gold-light)] text-sm tracking-[0.4em] uppercase font-medium">
            Heritage Artisan Furniture
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="font-serif text-5xl md:text-7xl lg:text-8xl text-[var(--ivory)] font-light leading-tight mb-8 max-w-5xl"
        >
          {data?.heroHeadline || (
            <>
              Crafted with <span className="font-normal">Legacy</span>
              <br />
              Not Manufactured
            </>
          )}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.7 }}
          className="text-[var(--ivory)]/80 text-lg md:text-xl max-w-2xl mb-12 font-light leading-relaxed"
        >
          {data?.heroSubheadline || "Each piece tells a story of timeless craftsmanship, premium hardwoods, and the patient hands that shape them into heirlooms for generations."}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.9 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Button className="bg-[var(--gold)] hover:bg-[var(--gold-light)] text-[var(--walnut-dark)] px-8 py-6 rounded-none text-sm tracking-wider uppercase font-semibold">
            Explore Collection
          </Button>
          <Button
            variant="outline"
            className="bg-transparent border-[var(--ivory)]/30 text-[var(--ivory)] hover:bg-[var(--ivory)]/10 px-8 py-6 rounded-none text-sm tracking-wider uppercase"
          >
            Our Craft
          </Button>
        </motion.div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-2 text-[var(--ivory)]/60"
        >
          <span className="text-xs tracking-[0.2em] uppercase">Discover</span>
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </motion.div>
    </section>
  );
}
