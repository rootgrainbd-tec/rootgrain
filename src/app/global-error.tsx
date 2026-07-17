"use client";

import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center p-24 text-center bg-gray-50">
          <h2 className="text-3xl font-bold text-red-900 mb-4">Critical System Error</h2>
          <p className="text-gray-700 mb-8">
            A fatal error prevented the application from loading. Our engineers have been notified.
          </p>
          <button
            onClick={() => {
              // Sentry.captureException(error);
              reset();
            }}
            className="px-6 py-2 bg-black text-white rounded"
          >
            Refresh Page
          </button>
        </div>
      </body>
    </html>
  );
}
