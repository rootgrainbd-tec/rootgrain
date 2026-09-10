"use client";

import { useState } from "react";
import Image from "next/image";
import { urlForImage } from "../../../sanity/lib/image";
import { UnifiedMedia } from "@/components/media/UnifiedMedia";

import type { SanityImage, SanityMuxVideo, SanityGalleryItem } from "@/types/sanity";

interface ProductGalleryProps {
  heroUrl: string;
  heroVideo?: SanityMuxVideo;
  galleryImages: SanityGalleryItem[];
  productName: string;
}

type MediaItem = {
  type: "image" | "video";
  url?: string;
  playbackId?: string;
  status?: string;
  posterUrl?: string;
};

export function ProductGallery({ heroUrl, heroVideo, galleryImages, productName }: ProductGalleryProps) {
  const parsedHero: MediaItem = heroVideo?.asset?.playbackId 
    ? { type: "video", playbackId: heroVideo.asset.playbackId, status: heroVideo.asset.status, url: heroVideo.asset.playbackId, posterUrl: heroUrl }
    : { type: "image", url: heroUrl };

  const [mainMedia, setMainMedia] = useState<MediaItem>(parsedHero);
  const [isZoomed, setIsZoomed] = useState(false);

  // Parse gallery image URLs to strings or video objects
  const parsedGallery: MediaItem[] = galleryImages.reduce<MediaItem[]>((acc, item) => {
    if (item._type === "mux.video" && item.asset?.playbackId) {
      acc.push({ type: "video", playbackId: item.asset.playbackId, status: item.asset.status, url: item.asset.playbackId });
    } else if (item.asset) {
      acc.push({ type: "image", url: urlForImage(item as SanityImage).url() });
    }
    return acc;
  }, []);

  // Combine hero image with gallery images for the thumbnail list
  const allMedia = [
    parsedHero, 
    ...parsedGallery.filter(m => (m.type === "video" ? m.playbackId !== parsedHero.playbackId : m.url !== parsedHero.url))
  ];

  return (
    <>
      <div className="space-y-6">
        <div 
          className={`relative aspect-square bg-[var(--parchment)] ${mainMedia.type === 'image' ? 'cursor-zoom-in group overflow-hidden' : 'overflow-hidden'}`}
          onClick={() => { if (mainMedia.type === 'image') setIsZoomed(true); }}
          onMouseMove={(e) => {
            if (mainMedia.type !== 'image') return;
            const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - left) / width) * 100;
            const y = ((e.clientY - top) / height) * 100;
            e.currentTarget.style.setProperty('--mouse-x', `${x}%`);
            e.currentTarget.style.setProperty('--mouse-y', `${y}%`);
          }}
        >
          {mainMedia.type === 'image' && (
            <div 
              className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{
                backgroundImage: `url(${mainMedia.url})`,
                backgroundPosition: 'var(--mouse-x) var(--mouse-y)',
                backgroundSize: '200%',
                backgroundRepeat: 'no-repeat',
              }}
            />
          )}
          
          <UnifiedMedia
            media={{ ...mainMedia, alt: productName }}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className={`object-contain p-4 transition-all duration-300 ${mainMedia.type === 'image' ? 'group-hover:opacity-0' : ''}`}
            priority
            autoPlay={false}
          />
          
          {/* Zoom hint icon */}
          {mainMedia.type === 'image' && (
            <div className="absolute bottom-4 right-4 z-20 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="11" x2="11" y1="8" y2="14"/><line x1="8" x2="14" y1="11" y2="11"/></svg>
            </div>
          )}
        </div>
        
        {allMedia.length > 1 && (
          <div className="grid grid-cols-4 gap-4">
            {allMedia.map((mediaItem, i) => {
              const isSelected = mainMedia.type === 'video' 
                ? mainMedia.playbackId === mediaItem.playbackId 
                : mainMedia.url === mediaItem.url;
                
              return (
                <button 
                  key={i} 
                  onClick={() => setMainMedia(mediaItem)}
                  className={`relative aspect-square bg-[var(--parchment)] overflow-hidden transition-all duration-200 ${isSelected ? 'ring-2 ring-[var(--walnut)] ring-offset-2 ring-offset-[var(--ivory)] opacity-100' : 'opacity-70 hover:opacity-100'}`}
                >
                  <Image
                    src={mediaItem.type === 'video' ? `https://image.mux.com/${mediaItem.playbackId}/thumbnail.jpg?time=0` : (mediaItem.url || '')}
                    alt={`${productName} thumbnail ${i+1}`}
                    fill
                    sizes="25vw"
                    className="object-contain p-2"
                  />
                  {mediaItem.type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="bg-black/40 rounded-full p-2 text-white/90">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Zoom Modal */}
      {isZoomed && mainMedia.type === 'image' && mainMedia.url && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setIsZoomed(false)}
        >
          <button 
            className="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors z-[60]"
            onClick={() => setIsZoomed(false)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
          </button>
          
          <div className="relative w-full h-full max-w-7xl max-h-[90vh]">
            <Image
              src={mainMedia.url}
              alt={`${productName} zoomed`}
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
      )}
    </>
  );
}
