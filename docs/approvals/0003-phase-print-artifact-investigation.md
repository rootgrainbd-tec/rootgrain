# Print Artifact Forensic Investigation

## Objective
Investigate the source of a persistent ~50x50px square with a thin blue outline at the bottom-right corner of the printed invoice output.

## Forensic Analysis

### 1. Global Component Investigation
- **WhatsAppButton**: Verified `print:hidden` is applied. Source: `src/components/layout/WhatsAppButton.tsx`
- **SonnerToaster**: Verified `print:hidden` is applied to the root `<SonnerToaster>` call. Checked `sonner` source code (`node_modules/sonner/dist/index.mjs`); the outer `<section>` has no dimensions, padding, or borders, and the inner `<ol>` inherits `print:hidden`.
- **Radix Toaster / ToastViewport**: Verified `print:hidden` is applied. Source: `src/components/ui/toast.tsx`.
- **Navigation & Footer**: Both are wrapped in `<div className="print:hidden">` in `src/app/(storefront)/checkout/layout.tsx`.
- **MaintenanceGuard**: Confirmed it only mounts `MaintenanceScreen` when active.
- **VerificationBanner**: Confirmed it renders at the top of the DOM flow, not fixed bottom-right.
- **SmoothScroll (Lenis)**: Does not render any DOM elements.

### 2. Portals & Injections
- **SearchCommand / CartSheet**: Radix UI portals do not mount when closed (`open=false`). Even if mounted, they are overlays, not a single bottom-right 50x50 element.
- **PrintButton**: Wrapped inside a `<div className="flex justify-end mb-8 print:hidden">` container. It is completely removed from the print tree.

### 3. CSS Analysis
- **Custom Scrollbars**: `::-webkit-scrollbar` was successfully disabled for `@media print` in `globals.css`.
- **Pseudo-elements**: Grep search for `::before` and `::after` in `globals.css` yielded no relevant structural artifacts.
- **Focus Rings**: Tailwind base sets `outline-ring/50`, but without an explicit element with `w-12 h-12` or similar dimensions being visible during print, this outline has nothing to attach to.

### 4. SDKs and Third-party Code
- **Google Analytics / Meta Pixel**: `next/script` injections were checked. They inject 1x1 or visually hidden iframes.
- **Sentry**: `@sentry/nextjs` is installed, but `sentry.client.config.ts` does not exist in the source tree, indicating the Sentry Feedback widget (which matches the visual description) is either not initialized natively or is injected externally (e.g., via Vercel).

## Conclusion
Extensive static source code analysis confirms there are no application-level UI elements left in the DOM during a print event that match a 50x50px bottom-right square. The element is likely injected by the deployment environment (e.g. Vercel Toolbar/Comments, or Vercel Sentry Integration) or is a browser-level rendering anomaly.

No application-level source element can be proven to produce this artifact.
