"use client";

import { useState } from "react";
import Image from "next/image";
import { urlForImage } from "../../../sanity/lib/image";

interface ProductGalleryProps {
  heroUrl: string;
  galleryImages: any[];
  productName: string;
}

export function ProductGallery({ heroUrl, galleryImages, productName }: ProductGalleryProps) {
  const [mainImage, setMainImage] = useState(heroUrl);
  const [isZoomed, setIsZoomed] = useState(false);

  // Parse gallery image URLs to strings
  const parsedGallery = galleryImages.map((img) => 
    typeof img === 'string' ? img : urlForImage(img).url()
  );

  // Combine hero image with gallery images for the thumbnail list
  const allImages = [heroUrl, ...parsedGallery.filter(url => url !== heroUrl)];

  return (
    <>
      <div className="space-y-6">
        <div 
          className="relative aspect-square bg-[var(--parchment)] cursor-zoom-in group"
          onClick={() => setIsZoomed(true)}
        >
          <Image
            src={mainImage}
            alt={productName}
            fill
            className="object-contain p-4 transition-opacity duration-300"
            priority
          />
          {/* Zoom hint icon */}
          <div className="absolute bottom-4 right-4 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="11" x2="11" y1="8" y2="14"/><line x1="8" x2="14" y1="11" y2="11"/></svg>
          </div>
        </div>
        
        {allImages.length > 1 && (
          <div className="grid grid-cols-4 gap-4">
            {allImages.map((imgUrl, i) => (
              <button 
                key={i} 
                onClick={() => setMainImage(imgUrl)}
                className={`relative aspect-square bg-[var(--parchment)] overflow-hidden transition-all duration-200 ${mainImage === imgUrl ? 'ring-2 ring-[var(--walnut)] ring-offset-2 ring-offset-[var(--ivory)] opacity-100' : 'opacity-70 hover:opacity-100'}`}
              >
                <Image
                  src={imgUrl}
                  alt={`${productName} thumbnail ${i+1}`}
                  fill
                  className="object-contain p-2"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Zoom Modal */}
      {isZoomed && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setIsZoomed(false)}
        >
          <button 
            className="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors"
            onClick={() => setIsZoomed(false)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
          </button>
          
          <div className="relative w-full h-full max-w-7xl max-h-[90vh]">
            <Image
              src={mainImage}
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
