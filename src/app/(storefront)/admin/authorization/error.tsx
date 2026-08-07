"use client";

import React from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center p-8 bg-red-50 rounded-lg border border-red-200">
        <h2 className="text-2xl font-bold text-red-800 mb-2">Something went wrong!</h2>
        <p className="text-red-600 mb-6">{error.message || "Failed to load the authorization interface."}</p>
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
