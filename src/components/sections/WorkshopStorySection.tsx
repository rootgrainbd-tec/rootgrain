"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";

import { urlForImage } from "../../../sanity/lib/image";
import { PortableText } from "next-sanity";
import type { SanityWorkshop } from "@/types/sanity";

interface WorkshopStat {
  number: string;
  label: string;
}

export function WorkshopStorySection({ data, stats }: { data?: SanityWorkshop | any, stats?: WorkshopStat[] }) {
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
            
            <div className="space-y-6 text-[var(--ivory)]/80 leading-relaxed portable-text">
              {data?.workshopStory && (
                <PortableText value={data.workshopStory} />
              )}
            </div>

            <div className="mt-10 flex flex-wrap gap-8">
              {stats?.map((stat: WorkshopStat, i: number) => (
                <div key={i}>
                  <div className="font-serif text-4xl text-[var(--gold)]">{stat.number}</div>
                  <div className="text-sm text-[var(--ivory)]/60 mt-1">{stat.label}</div>
                </div>
              )) || (
                <>
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
                </>
              )}
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
                src={data?.workshopImage ? urlForImage(data.workshopImage).url() : "/images/workshop-interior.png"}
                alt="RootGrain Workshop"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
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
