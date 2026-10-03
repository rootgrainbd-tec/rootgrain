"use client";

import { useEffect } from "react";
import { useRecentlyViewedStore } from "@/store/useRecentlyViewedStore";
import type { ViewedProduct } from "@/store/useRecentlyViewedStore";

export function RecentlyViewedTracker({ product }: { product: ViewedProduct }) {
  const addItem = useRecentlyViewedStore((state) => state.addItem);

  useEffect(() => {
    addItem(product);
    
    // Meta Pixel: ViewContent
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq('track', 'ViewContent', {
        content_name: product.name,
        content_ids: [product.id],
        content_type: 'product',
        value: product.price,
        currency: 'BDT'
      });
    }
  }, [product, addItem]);

  return null;
}
