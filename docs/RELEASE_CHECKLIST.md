# RootGrain v1.0 Release Checklist

This checklist covers the required operational, infrastructure, and validation tasks that must be completed before or during the official RootGrain v1.0 production launch.

## Infrastructure
- [ ] Production environment provisioned (Vercel/Node.js host)
- [ ] Node.js runtime configured to match `package.json` engines
- [ ] Production Sanity dataset finalized and verified

## DNS & Domain
- [ ] Root domain configured (A/CNAME records)
- [ ] `www` subdomain configured (if applicable)
- [ ] Email domain authentication (DKIM, SPF, DMARC) verified for transactional emails

## SSL
- [ ] SSL/TLS certificate provisioned and verified
- [ ] HTTP to HTTPS redirect active
- [ ] Let's Encrypt (or custom CA) auto-renewal configured

## Database
- [ ] Production PostgreSQL database provisioned
- [ ] Prisma migrations successfully applied to production (`npx prisma migrate deploy`)
- [ ] Database connection pooling verified
- [ ] Initial admin user created

## Secrets & Configuration
- [ ] Production environment variables (`.env.production`) securely injected
- [ ] `NEXTAUTH_SECRET` generated (strong cryptographic entropy)
- [ ] Third-party API keys verified (Sanity, Payment Gateway, Shipping APIs, etc.)
- [ ] Public variables (`NEXT_PUBLIC_*`) verified for correct production IDs

## Backups
- [ ] Database automated daily snapshots enabled
- [ ] Restore Procedure documented and verified
- [ ] Point-in-time recovery (PITR) verified
- [ ] Sanity dataset export schedule defined

## Monitoring
- [ ] Vercel Analytics / Core Web Vitals tracking enabled
- [ ] Uptime monitoring tool (e.g., BetterUptime, Pingdom) configured
- [ ] Performance alerts defined

## Logging
- [ ] Structured logging service connected (e.g., Datadog, Sentry)
- [ ] Error notification channel (e.g., Slack, Email) integrated
- [ ] Log retention policies configured

## CI/CD
- [ ] `ci.yml` GitHub Actions workflow verified against the `main` branch
- [ ] Automated deployment trigger verified on successful merge
- [ ] Build caching optimized in CI

## Branch Protection
- [ ] `main` branch protected from direct pushes
- [ ] Required passing status checks (lint, tsc, build) before merge
- [ ] Required code owner review enabled

## Release Tag
- [ ] Final `v1.0.0` Git tag created and pushed to the repository
- [ ] GitHub Release notes drafted matching `CHANGELOG_v1.0.md`

## Rollback Plan
- [ ] Vercel instant rollback procedure documented (or equivalent deployment reversion)
- [ ] Database rollback strategy defined for destructive migrations

## Smoke Tests
- [ ] User Registration & Login flow verified on production
- [ ] Complete Guest Checkout flow verified
- [ ] Complete Authenticated Checkout flow verified
- [ ] Admin dashboard access and basic CRUD operations verified
- [ ] Contact/Inquiry forms submitting correctly

## Production Validation
- [ ] No exposed internal error stack traces
- [ ] Payment gateway is in Live/Production mode (Test mode disabled)
- [ ] Email delivery confirmed (no test/sandbox domains)
- [ ] SEO indexing permitted (`robots.txt` updated to `Allow: /`)

## Launch Approval
- [ ] Final engineering sign-off achieved
- [ ] Final business sign-off achieved
- [ ] Application officially launched
