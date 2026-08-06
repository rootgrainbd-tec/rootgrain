# ADR-002: Brand Asset Architecture & Single Source of Truth

## Architecture Overview
The RootGrain website now employs a centralized brand asset architecture. Previously, brand assets (logos, company names, icons) were hard-coded inconsistently across UI components, email templates, and PDF invoices. This architecture introduces `BrandService` (`src/lib/brand.ts`) as the single source of truth for all branding-related strings and visual assets.

The flow of brand data is:
**CMS (Sanity) -> Site Settings -> `SiteConfig` -> `BrandService` -> Application Layers**

## Single Source of Truth
Every component (React UI, email generators, PDF generators, Next.js Metadata) must instantiate or receive `BrandService`. 
Business contact information (addresses, support emails) is strictly excluded from `BrandService` and remains accessed directly from `SiteConfig` to maintain separation of concerns between visual brand identity and functional business operations.

## Fallback Strategy
If the CMS is unavailable or an administrator clears the logo fields, `BrandService` ensures that the production site never breaks. It natively falls back to statically hosted `/images/...` paths for all assets.
- `getLogo()` -> `/images/rootgrain-logo.svg`
- `getDarkLogo()` -> `/images/rootgrain-logo-dark.svg`
- `getCompanyName()` -> `RootGrain`

## Cache Strategy
`BrandService` is instantiated synchronously on the server using `getSiteConfig()`, which utilizes Next.js Data Cache.
When an administrator changes assets in the CMS, revalidating the `SiteConfig` automatically updates `BrandService`, which propagates the changes globally (UI, Metadata, Emails, PDFs) without requiring code deployments.

## Migration History
- **Slice 1:** Infrastructure created (`BrandService`, `siteSettings` schema, `SiteConfig` types).
- **Slice 2:** Migrated UI (`Navigation`, `Footer`) and Email (`email.ts`).
- **Slice 3 (Final):** Migrated Metadata (`layout.tsx`), error pages (`not-found.tsx`), and PDF generators (`pdfGenerator.ts`).

## Deployment Strategy
All components seamlessly fallback to static assets. No database migrations are required. Deploying these changes is safe as they leverage existing caching and hydration strategies without modifying authentication or external business logic.
