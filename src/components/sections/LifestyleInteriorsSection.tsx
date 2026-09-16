"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { UnifiedMedia } from "@/components/media/UnifiedMedia";
import { Button } from "@/components/ui/button";
import type { SanityHomepage } from "@/types/sanity";
import { urlForImage } from "../../../sanity/lib/image";

export function LifestyleInteriorsSection({ data }: { data?: SanityHomepage | any }) {
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
            {data?.lifestyleTitle || "Lifestyle Interiors"}
          </h2>
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent mx-auto mb-8" />
          <p className="text-[var(--walnut-light)] text-lg max-w-2xl mx-auto leading-relaxed">
            {data?.lifestyleDescription || "Our furniture finds its home in spaces that value authenticity, warmth, and the quiet luxury of natural materials."}
          </p>
        </motion.div>

        {/* Large Image */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1 }}
          className="relative aspect-[21/9] overflow-hidden mb-8"
        >
          <UnifiedMedia
            media={data?.lifestyleVideo?.asset?.playbackId ? { type: "video", playbackId: data.lifestyleVideo.asset.playbackId, status: data.lifestyleVideo.asset.status, alt: "RootGrain lifestyle interior", posterUrl: data?.lifestyleImage?.asset ? urlForImage(data.lifestyleImage).url() : undefined } : { type: "image", url: data?.lifestyleImage?.asset ? urlForImage(data.lifestyleImage).url() : "/images/lifestyle-interior.png", alt: "RootGrain furniture in a warm Japandi-style interior" }}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1280px"
            className="object-cover"
            autoPlay="muted"
            loop
            muted
            playsInline
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--walnut-dark)]/30 to-transparent" />
          <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between">
            <div>
              <p className="text-[var(--ivory)]/70 text-sm tracking-wider uppercase mb-2">Featured Space</p>
              <p className="font-serif text-2xl text-[var(--ivory)]">{data?.lifestyleSpace || "A Japandi Dining Room"}</p>
            </div>
            {data?.lifestyleCtaUrl ? (
              <Link href={data.lifestyleCtaUrl}>
                <Button className="bg-[var(--ivory)] text-[var(--walnut-dark)] hover:bg-[var(--gold)] rounded-none px-6 py-4 text-sm tracking-wider uppercase">
                  {data?.lifestyleCtaLabel || "Explore Spaces"}
                </Button>
              </Link>
            ) : (
              <Button className="bg-[var(--ivory)] text-[var(--walnut-dark)] hover:bg-[var(--gold)] rounded-none px-6 py-4 text-sm tracking-wider uppercase">
                {data?.lifestyleCtaLabel || "Explore Spaces"}
              </Button>
            )}
          </div>
        </motion.div>

        {/* Two Column Images */}
        <div className="grid md:grid-cols-2 gap-8">
          {(() => {
            const card1 = data?.lifestyleCards?.[0];
            const card1IsValid = Boolean(card1?.image?.asset && card1?.title && card1?.subtitle);
            const card1ImageSrc = card1IsValid ? urlForImage(card1.image).url() : "/images/craft-finishing.png";
            const card1Alt = card1IsValid ? (card1.image.alt || card1.title) : "Artisan finishing process";
            const card1Title = card1IsValid ? card1.title : "The Finishing Touch";
            const card1Subtitle = card1IsValid ? card1.subtitle : "Hand-rubbed oil finishes";

            return (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative aspect-[4/3] overflow-hidden group cursor-pointer"
              >
                <Image
                  src={card1ImageSrc}
                  alt={card1Alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-[var(--walnut-dark)]/0 group-hover:bg-[var(--walnut-dark)]/20 transition-colors duration-500" />
                <div className="absolute bottom-6 left-6">
                  <p className="font-serif text-xl text-[var(--ivory)]">{card1Title}</p>
                  <p className="text-[var(--ivory)]/70 text-sm mt-1">{card1Subtitle}</p>
                </div>
              </motion.div>
            );
          })()}

          {(() => {
            const card2 = data?.lifestyleCards?.[1];
            const card2IsValid = Boolean(card2?.image?.asset && card2?.title && card2?.subtitle);
            const card2ImageSrc = card2IsValid ? urlForImage(card2.image).url() : "/images/product-decor.png";
            const card2Alt = card2IsValid ? (card2.image.alt || card2.title) : "Artisan home decor pieces";
            const card2Title = card2IsValid ? card2.title : "Artisan Decor";
            const card2Subtitle = card2IsValid ? card2.subtitle : "Handcrafted home accessories";

            return (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="relative aspect-[4/3] overflow-hidden group cursor-pointer"
              >
                <Image
                  src={card2ImageSrc}
                  alt={card2Alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-[var(--walnut-dark)]/0 group-hover:bg-[var(--walnut-dark)]/20 transition-colors duration-500" />
                <div className="absolute bottom-6 left-6">
                  <p className="font-serif text-xl text-[var(--ivory)]">{card2Title}</p>
                  <p className="text-[var(--ivory)]/70 text-sm mt-1">{card2Subtitle}</p>
                </div>
              </motion.div>
            );
          })()}
        </div>
      </div>
    </section>
  );
}
