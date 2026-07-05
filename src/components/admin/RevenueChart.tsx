"use client";

import { useMemo } from "react";

interface MonthlyData {
  month: string;
  revenue: number;
}

export function RevenueChart({ data }: { data: MonthlyData[] }) {
  const maxRevenue = useMemo(() => {
    return Math.max(...data.map(d => d.revenue), 1000); // minimum scale of 1000
  }, [data]);

  if (data.length === 0) {
    return <div className="text-[var(--walnut-light)]">No revenue data available.</div>;
  }

  return (
    <div className="w-full h-64 flex items-end gap-2 sm:gap-6 pt-8 pb-4">
      {data.map((item, i) => {
        const heightPct = Math.max((item.revenue / maxRevenue) * 100, 2); // min height 2%
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
            <div className="w-full relative flex flex-col justify-end h-full">
              {/* Tooltip */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[var(--walnut-dark)] text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                ৳{item.revenue.toLocaleString()}
              </div>
              <div 
                className="w-full bg-[var(--gold)]/80 hover:bg-[var(--gold)] transition-all rounded-t-sm"
                style={{ height: `${heightPct}%` }}
              />
            </div>
            <span className="text-xs text-[var(--walnut-light)] font-medium uppercase">{item.month}</span>
          </div>
        );
      })}
    </div>
  );
}
