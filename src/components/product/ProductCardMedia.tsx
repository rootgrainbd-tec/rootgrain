"use client";

import { useState, useEffect, useRef, useId } from "react";
import Image from "next/image";
import MuxPlayer from "@mux/mux-player-react";
import type { ProductCardMediaData } from "@/types/product";

interface ProductCardMediaProps {
  mediaData?: ProductCardMediaData;
  altText: string;
}

export function ProductCardMedia({ mediaData, altText }: ProductCardMediaProps) {
  // 1. Core State
  const cardInstanceId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | any>(null);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [videoError, setVideoError] = useState(false);

  // 2. Data Extraction
  // Even if mediaData is somehow undefined, we fall back gracefully.
  const previewType = mediaData?.previewType || "default";
  const imageBehavior = mediaData?.imageBehavior || "fixed";
  const videoAutoplay = mediaData?.videoAutoplay || false;
  const heroImageUrl = mediaData?.heroImageUrl;
  const heroVideoId = mediaData?.heroVideoId;
  const gallery = mediaData?.galleryImageUrls || [];

  const muxThumbnail = heroVideoId ? `https://image.mux.com/${heroVideoId}/thumbnail.jpg?time=0` : undefined;
  // Build slideshow URLs (hero image first, then gallery)
  const slideshowUrls = heroImageUrl ? [heroImageUrl, ...gallery] : gallery;

  // 3. Mode Resolution
  const isDefault = previewType === "default";
  const isImage = previewType === "image";
  const isVideo = previewType === "video";

  const slideshowEnabled = isImage && imageBehavior === "slideshow" && slideshowUrls.length > 1 && !prefersReducedMotion;
  const autoplayEnabled = isVideo && videoAutoplay && !!heroVideoId && !prefersReducedMotion;

  // 4. Reduced Motion Observer
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // 5. Viewport Observer
  useEffect(() => {
    // Only attach observer if we need it for slideshow or video autoplay
    if (!slideshowEnabled && !autoplayEnabled) return;

    const observer = new IntersectionObserver(
      (entries) => setIsVisible(entries[0].isIntersecting),
      { threshold: 0.5 } // Moderate threshold: card must be at least 50% visible
    );

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [slideshowEnabled, autoplayEnabled]);

  // 6. Slideshow Logic
  useEffect(() => {
    if (!slideshowEnabled || !isVisible) return;

    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % slideshowUrls.length);
    }, 2800); // 2.8s per frame

    return () => clearInterval(timer);
  }, [slideshowEnabled, isVisible, slideshowUrls.length]);

  useEffect(() => {
    if (slideshowEnabled && isVisible) {
      const nextIndex = (currentImageIndex + 1) % slideshowUrls.length;
      const img = new window.Image();
      img.src = slideshowUrls[nextIndex];
    }
  }, [currentImageIndex, slideshowEnabled, isVisible, slideshowUrls]);

  // 7. Video Coordination Logic
  useEffect(() => {
    if (!autoplayEnabled) return;

    const handleVideoPlaying = (e: CustomEvent<{ id: string }>) => {
      if (e.detail.id !== cardInstanceId && videoRef.current) {
        try {
          // Pause this video because another one started
          if (typeof videoRef.current.pause === 'function') {
             videoRef.current.pause();
          }
        } catch (err) {}
      }
    };

    window.addEventListener("rootgrain-video-playing", handleVideoPlaying as EventListener);
    return () => window.removeEventListener("rootgrain-video-playing", handleVideoPlaying as EventListener);
  }, [autoplayEnabled, cardInstanceId]);

  useEffect(() => {
    if (!autoplayEnabled || !videoRef.current) return;

    let isMounted = true;

    if (isVisible) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          if (isMounted) {
            const event = new CustomEvent("rootgrain-video-playing", { detail: { id: cardInstanceId } });
            window.dispatchEvent(event);
          }
        }).catch(() => {});
      }
    } else {
      try {
         if (typeof videoRef.current.pause === 'function') {
           videoRef.current.pause();
         }
      } catch (err) {}
    }

    return () => {
      isMounted = false;
    };
  }, [isVisible, autoplayEnabled, cardInstanceId]);

  // 8. Render Helpers
  const renderStaticImage = (url: string | undefined) => {
    if (!url) return null;
    return (
      <Image
        src={url}
        alt={altText}
        fill
        className="object-cover transition-transform duration-700 group-hover:scale-105"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    );
  };

  // 9. Main Render Logic

  // DEFAULT / LEGACY MODE
  if (isDefault || (!isImage && !isVideo)) {
    return (
      <div className="w-full h-full relative" ref={containerRef}>
        {renderStaticImage(heroImageUrl || muxThumbnail)}
      </div>
    );
  }

  // IMAGE MODE
  if (isImage) {
    if (slideshowEnabled) {
      return (
        <div className="w-full h-full relative" ref={containerRef}>
          {slideshowUrls.map((url, idx) => (
            <div
              key={url}
              className={`absolute inset-0 transition-opacity duration-1000 ${idx === currentImageIndex ? "opacity-100" : "opacity-0"}`}
            >
              <Image
                src={url}
                alt={`${altText} - image ${idx + 1}`}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          ))}
        </div>
      );
    }
    // Fixed image or reduced motion fallback
    const fixedUrl = heroImageUrl || slideshowUrls[0];
    return (
      <div className="w-full h-full relative" ref={containerRef}>
        {renderStaticImage(fixedUrl)}
      </div>
    );
  }

  // VIDEO MODE
  if (isVideo) {
    if (autoplayEnabled && !videoError) {
      return (
        <div className="w-full h-full relative group-hover:scale-105 transition-transform duration-700" ref={containerRef}>
          <MuxPlayer
            ref={videoRef}
            playbackId={heroVideoId}
            metadata={{ video_title: altText }}
            streamType="on-demand"
            muted
            loop
            playsInline
            poster={muxThumbnail}
            onError={() => setVideoError(true)}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover"
            }}
          />
        </div>
      );
    }
    // Autoplay OFF, runtime error, invalid playbackId, or reduced motion
    const fallbackUrl = heroVideoId ? muxThumbnail : heroImageUrl;
    return (
      <div className="w-full h-full relative" ref={containerRef}>
        {renderStaticImage(fallbackUrl)}
      </div>
    );
  }

  return null;
}
