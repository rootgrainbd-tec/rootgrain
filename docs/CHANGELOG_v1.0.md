# Changelog v1.0 (RootGrain)

This document highlights the major engineering, architecture, security, and performance improvements finalized during the RootGrain v1.0 Release Candidate development phase.

## Major Engineering Improvements
- Established a unified, type-safe API orchestration utilizing Next.js App Router.
- Implemented a rigorous Zod-based runtime input validation schema across all external boundaries.
- Consolidated error handling into a predictable `AppError` pattern, ensuring safe HTTP status responses and localized client feedback.

## Architecture Improvements
- **Strict Layered Architecture Migration:** Completely overhauled the codebase to enforce separation of concerns:
  - **Controllers** (API Routes / Server Actions) only handle HTTP parsing, authentication wrapping, and response execution.
  - **Services** encapsulate all complex business logic, preventing domain leakage.
  - **Repositories** abstract raw data access, acting as the sole authorized invokers of the Prisma client.
- Eliminated all cross-layer contamination and direct Prisma calls from the presentation and routing layers.

## Security Improvements
- **Authentication:** Hardened NextAuth cookie configurations (`__Secure-` prefix enforcement on production).
- **Authorization:** Deployed granular Role-Based Access Control (RBAC), deeply integrated within both Edge Middleware and Service layers.
- **OWASP Remediation:** 
  - Replaced insecure `Math.random()` usage in order and coupon generation with cryptographic primitives (`crypto.randomInt`, `crypto.randomBytes`).
  - Added HTML escaping standardizations to prevent injection within email templating engines.
- **Production Hardening:** Injected strict security headers globally (`Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`, `Referrer-Policy`, `Permissions-Policy`).
- Isolated environment secrets successfully, confirming no sensitive API keys are exposed to the client bundle.

## Performance Improvements
- **Dynamic Imports:** Decreased the initial JavaScript bundle size by lazily loading heavy client overlays (CartSheet, SearchCommand) using `next/dynamic`.
- **Image Optimization:** Applied responsive `sizes` mappings to `next/image` in the Product Gallery, drastically reducing bytes downloaded for thumbnails.
- **SEO & Metadata:** Implemented dynamic `generateMetadata` on product pages to populate optimal `<title>`, OpenGraph attributes, and canonical URLs.
- **Database Optimization:** Refined the memory footprint of Prisma operations by aggressively filtering relationship payloads (e.g., explicitly omitting unnecessary user fields during order retrieval).
- **Caching:** Confirmed robust usage of Next.js Incremental Static Regeneration (ISR) with `revalidate` polling for catalog pages.

## Breaking Changes
- **None.** All architectural refactors and security enhancements were engineered to strictly maintain backward compatibility with existing feature functionality and client state.

## Known Limitations
- Content Security Policy (CSP) is intentionally deferred to avoid blocking critical integrations (Sanity Studio, Analytics) without dedicated regression testing.
- Rate-limiting relies on NextAuth native protections and Next.js ISR; no dedicated Redis layer exists yet.

## Future Improvements
- Integration of a dedicated observability and tracing platform (e.g., Sentry, Datadog).
- Transition to Edge computing for select API endpoints to decrease global latency.
- Infrastructure automation via Terraform for seamless environment cloning and disaster recovery.
