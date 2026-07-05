"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRecentlyViewedStore } from "@/store/useRecentlyViewedStore";

interface RecentlyViewedProps {
  currentProductId: string;
}

export function RecentlyViewed({ currentProductId }: RecentlyViewedProps) {
  const [mounted, setMounted] = useState(false);
  const items = useRecentlyViewedStore((state) => state.items);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Filter out the current product and ensure we have items to show
  const displayItems = items.filter(item => item.id !== currentProductId).slice(0, 4);

  if (displayItems.length === 0) return null;

  return (
    <div className="py-16 border-t border-[var(--walnut-light)]/20">
      <h2 className="font-serif text-2xl text-[var(--walnut-dark)] mb-8">Recently Viewed</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {displayItems.map((item) => (
          <Link 
            key={item.id} 
            href={`/product/${item.id}`}
            className="group block"
          >
            <div className="relative aspect-square bg-[var(--parchment)] mb-4 overflow-hidden">
              <Image
                src={item.image}
                alt={item.name}
                fill
                className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <h3 className="font-medium text-[var(--walnut-dark)] truncate">{item.name}</h3>
            <p className="text-sm text-[var(--walnut)] mt-1">৳{item.price.toLocaleString()}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
