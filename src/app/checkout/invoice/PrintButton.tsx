"use client";

export default function PrintButton() {
  return (
    <button 
      onClick={() => {
        if (typeof window !== "undefined") window.print();
      }}
      className="bg-[var(--walnut)] text-white px-4 py-2 rounded-sm"
    >
      Print / Save PDF
    </button>
  );
}
