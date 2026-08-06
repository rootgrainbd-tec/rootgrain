# ADR-001: Google OAuth Verification

## Status
Approved

## Context
Our authentication architecture combines NextAuth's `GoogleProvider` and `CredentialsProvider`. Credentials users must verify their email ownership via a Magic Link. Google OAuth users, however, have already proven their identity and email ownership to Google, an inherently trusted identity provider.

By default, the NextAuth core library forces new OAuth accounts to be initialized with `emailVerified = null` in the database adapter to prevent unintended account linking exploits. 

Previously, there were attempts to forcefully override the database field `emailVerified` during the `linkAccount` event. This proved brittle, created typing issues, and circumvented intended architectural patterns of the underlying NextAuth package.

## Decision
We will cleanly segregate the trust models at the application level:
1. **Credentials users**: Must explicitly verify their email. They have `emailVerified: null` initially.
2. **Google users**: Are implicitly verified through the provider (`provider: "google"`). 

**We will NOT fake database values or mutate NextAuth internals.** 
Instead, we extract the `provider` string during the initial JWT callback, pipe it down to the `Session` payload, and use a centralized verification helper `needsEmailVerification(user)` everywhere in the UI and business logic. 

## Consequences
- **Why Google users bypass local verification**: Google acts as a trusted Identity Provider. Duplicating the verification flow for OAuth users introduces friction and provides no additional security.
- **Why emailVerified remains NULL for OAuth users**: To respect the NextAuth core package design. The PrismaAdapter initializes the user as `null` by design to protect against account-hijacking.
- **Why this is an intentional business rule**: OAuth explicitly shifts trust responsibilities to the third party. 
- **Why direct `emailVerified` checks must never be used**: Direct checks (e.g. `if (user.emailVerified)`) are incomplete and will falsely flag Google users as unverified. Always use `needsEmailVerification(user)` from `@/lib/verification`.
