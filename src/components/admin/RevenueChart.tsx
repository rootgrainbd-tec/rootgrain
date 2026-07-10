"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface MonthlyData {
  month: string;
  revenue: number;
}

export function RevenueChart({ data }: { data: MonthlyData[] }) {
  if (data.length === 0) {
    return <div className="text-[var(--walnut-light)]">No revenue data available.</div>;
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[var(--walnut-dark)] text-white p-3 rounded shadow-lg border border-[var(--gold)]/20">
          <p className="font-semibold text-[var(--gold)] mb-1">{label}</p>
          <p>Revenue: ৳{payload[0].value.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[300px] mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis 
            dataKey="month" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#735238', fontSize: 12, fontWeight: 500 }}
            dy={10}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#735238', fontSize: 12 }}
            tickFormatter={(value) => `৳${value >= 1000 ? (value/1000).toFixed(0) + 'k' : value}`}
            dx={-10}
          />
          <Tooltip cursor={{ fill: 'rgba(212, 175, 55, 0.1)' }} content={<CustomTooltip />} />
          <Bar 
            dataKey="revenue" 
            fill="var(--gold)" 
            radius={[4, 4, 0, 0]}
            maxBarSize={50}
            animationDuration={1500}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
