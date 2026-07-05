"use client";

import { useRef, Fragment } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StyledText } from "@/components/ui/StyledText";

import { urlForImage } from "../../../sanity/lib/image";
import type { SanityHomepage } from "@/types/sanity";

export function HeroSection({ data }: { data?: SanityHomepage }) {
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
          transition={{ duration: 1, delay: 0.5 }}
          className="font-serif text-[var(--ivory)] font-light leading-tight mb-8 w-full"
        >
          <StyledText data={data?.heroHeadline as any} defaultTag="h1" className="text-5xl md:text-7xl lg:text-8xl" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.7 }}
          className="text-[var(--ivory)]/80 mb-12 w-full font-light leading-relaxed"
        >
          <StyledText data={data?.heroSubheadline as any} defaultTag="p" className="text-lg md:text-xl" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.9 }}
          className="flex flex-col sm:flex-row gap-4 mt-12 translate-y-24 md:translate-y-32"
        >
          <Link href="/collection">
            <Button className="w-full sm:w-auto bg-[var(--gold)] hover:bg-[var(--gold-light)] text-[var(--walnut-dark)] px-8 py-6 rounded-none text-sm tracking-wider uppercase font-semibold">
              Explore Collection
            </Button>
          </Link>
          <Link href="/#craftsmanship">
            <Button
              variant="outline"
              className="w-full sm:w-auto bg-transparent border-[var(--ivory)]/30 text-[var(--ivory)] hover:bg-[var(--ivory)]/10 px-8 py-6 rounded-none text-sm tracking-wider uppercase"
            >
              Our Craft
            </Button>
          </Link>
          <Link href="/#contact">
            <Button
              variant="outline"
              className="w-full sm:w-auto bg-transparent border-[var(--ivory)]/30 text-[var(--ivory)] hover:bg-[var(--ivory)]/10 px-8 py-6 rounded-none text-sm tracking-wider uppercase"
            >
              Visit Atelier
            </Button>
          </Link>
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
