"use client";

import { useEffect } from "react";
import { useRecentlyViewedStore } from "@/store/useRecentlyViewedStore";
import type { ViewedProduct } from "@/store/useRecentlyViewedStore";

export function RecentlyViewedTracker({ product }: { product: ViewedProduct }) {
  const addItem = useRecentlyViewedStore((state) => state.addItem);

  useEffect(() => {
    addItem(product);
  }, [product, addItem]);

  return null;
}
