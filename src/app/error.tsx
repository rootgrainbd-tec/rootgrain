"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
    // Sentry.captureException(error); // Uncomment when Sentry is fully configured
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24 text-center">
      <h2 className="text-3xl font-bold tracking-tight mb-4 text-red-800">Something went wrong!</h2>
      <p className="text-gray-600 mb-8 max-w-md">
        We apologize for the inconvenience. An unexpected error occurred while processing your request.
      </p>
      <button
        onClick={() => reset()}
        className="px-6 py-2 bg-stone-900 text-white rounded hover:bg-stone-800 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
