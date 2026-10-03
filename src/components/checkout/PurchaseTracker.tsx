"use client";

import { useEffect, useRef } from "react";

interface PurchaseTrackerProps {
  orderNumber: string;
  total: number;
}

export function PurchaseTracker({ orderNumber, total }: PurchaseTrackerProps) {
  const hasFired = useRef(false);

  useEffect(() => {
    // Only fire once, and deduplicate using localStorage
    const storageKey = `meta_purchase_${orderNumber}`;
    
    if (typeof window !== "undefined") {
      const alreadyFired = localStorage.getItem(storageKey);

      if (!hasFired.current && !alreadyFired && (window as any).fbq) {
        (window as any).fbq('track', 'Purchase', {
          value: total,
          currency: 'BDT',
          content_type: 'product'
        });
        hasFired.current = true;
        localStorage.setItem(storageKey, "true");
      }
    }
  }, [orderNumber, total]);

  return null;
}
