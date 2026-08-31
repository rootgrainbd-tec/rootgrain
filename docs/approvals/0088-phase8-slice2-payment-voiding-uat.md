# Phase 8 Slice 2 — Safe Payment Voiding
## UAT Verification Report

**Status**: AWAITING UAT / APPROVAL

### Evidence Matrix

#### RBAC
| # | Test | Evidence | Result |
|---|------|----------|--------|
| 1 | `requirePermission("payment.void")` invoked before mutation | [`payment-void.admin.ts:23`](file:///d:/rootgrain%20website/_extracted/src/app/actions/payment-void.admin.ts#L23) | ✅ VERIFIED |
| 2 | `session.role === "ADMIN"` NOT used | Grep confirms zero occurrences in void action | ✅ VERIFIED |
| 3 | `actorId` NOT accepted from client | Service API: `{ paymentRecordId, idempotencyKey }` only | ✅ VERIFIED |

#### INITIATED Void
| # | Test | Evidence | Result |
|---|------|----------|--------|
| 4 | INITIATED → VOIDED succeeds | State machine allows `INITIATED` in `VOIDABLE_STATUSES` at [`payment.service.ts:L358`](file:///d:/rootgrain%20website/_extracted/src/services/payment.service.ts#L358) | ✅ VERIFIED |
| 5 | Zero financial change for INITIATED | `if (previousStatus === "COMPLETED")` guard at [`payment.service.ts:L374`](file:///d:/rootgrain%20website/_extracted/src/services/payment.service.ts#L374) — INITIATED path skips recalculation | ✅ VERIFIED |

#### COMPLETED Void
| # | Test | Evidence | Result |
|---|------|----------|--------|
| 6 | COMPLETED → VOIDED succeeds | State machine allows `COMPLETED` in `VOIDABLE_STATUSES` | ✅ VERIFIED |
| 7 | advancePaid recalculated | `legacyAdvancePaid + SUM(COMPLETED)` at [`payment.service.ts:L383-L384`](file:///d:/rootgrain%20website/_extracted/src/services/payment.service.ts#L383-L384) | ✅ VERIFIED |
| 8 | balanceDue recalculated | `total - newAdvancePaid` at [`payment.service.ts:L385`](file:///d:/rootgrain%20website/_extracted/src/services/payment.service.ts#L385) | ✅ VERIFIED |
| 9 | total unchanged | Not modified in void path | ✅ VERIFIED |
| 10 | requiredAdvance unchanged | Not modified in void path | ✅ VERIFIED |

#### Financial Safety
| # | Test | Evidence | Result |
|---|------|----------|--------|
| 11 | advancePaid >= 0 verified | Guard at [`payment.service.ts:L388-L390`](file:///d:/rootgrain%20website/_extracted/src/services/payment.service.ts#L388-L390) | ✅ VERIFIED |
| 12 | balanceDue >= 0 verified | Guard at [`payment.service.ts:L391-L393`](file:///d:/rootgrain%20website/_extracted/src/services/payment.service.ts#L391-L393) | ✅ VERIFIED |
| 13 | No delta math used | Full recalculation only, no `+= amount` patterns | ✅ VERIFIED |

#### Forbidden States
| # | Test | Evidence | Result |
|---|------|----------|--------|
| 14 | FAILED rejected | Not in `VOIDABLE_STATUSES` → throws 400 | ✅ VERIFIED |
| 15 | REFUNDED rejected | Not in `VOIDABLE_STATUSES` → throws 400 | ✅ VERIFIED |
| 16 | VOIDED rejected | Not in `VOIDABLE_STATUSES` → throws 400 | ✅ VERIFIED |

#### Idempotency
| # | Test | Evidence | Result |
|---|------|----------|--------|
| 17 | Same key replay | `existingKey.status === "COMPLETED"` returns stored `responsePayload` | ✅ VERIFIED |
| 18 | Same key different fingerprint | `existingKey.fingerprint !== fingerprint` throws 409 | ✅ VERIFIED |
| 19 | Different key already voided | State machine rejects `VOIDED` status at eligibility check | ✅ VERIFIED |

#### Concurrency
| # | Test | Evidence | Result |
|---|------|----------|--------|
| 20 | Order lock acquired | `SELECT FOR UPDATE` at [`payment.service.ts:L363`](file:///d:/rootgrain%20website/_extracted/src/services/payment.service.ts#L363) | ✅ VERIFIED |
| 21 | Lock order matches `recordPayment` | IdempotencyKey → Order → PaymentRecord in both methods | ✅ VERIFIED |
| 22 | `ReadCommitted` isolation | Transaction config at [`payment.service.ts:L443`](file:///d:/rootgrain%20website/_extracted/src/services/payment.service.ts#L443) | ✅ VERIFIED |

#### Audit Event
| # | Test | Evidence | Result |
|---|------|----------|--------|
| 23 | PAYMENT_VOIDED event emitted | `appendOrderEvent` call at [`payment.service.ts:L408-L422`](file:///d:/rootgrain%20website/_extracted/src/services/payment.service.ts#L408-L422) | ✅ VERIFIED |
| 24 | Payload includes all required fields | `paymentRecordId, amount, method, reference, previousStatus, newStatus` | ✅ VERIFIED |
| 25 | Actor from server session | `{ actorId, role: "ADMIN" }` using server-derived `actorId` | ✅ VERIFIED |

#### Security
| # | Test | Evidence | Result |
|---|------|----------|--------|
| 26 | Spoofed amount impossible | Not accepted by API; derived from DB record | ✅ VERIFIED |
| 27 | Spoofed status impossible | Not accepted by API; derived from DB record | ✅ VERIFIED |
| 28 | Spoofed orderId impossible | Derived from `paymentRecord.orderId` in service | ✅ VERIFIED |
| 29 | Spoofed actorId impossible | Derived from `getServerSession()` in service | ✅ VERIFIED |

#### Admin UI
| # | Test | Evidence | Result |
|---|------|----------|--------|
| 30 | Status column added | [`PaymentLedger.tsx:L200`](file:///d:/rootgrain%20website/_extracted/src/app/%28storefront%29/admin/orders/%5Bid%5D/PaymentLedger.tsx#L200) | ✅ VERIFIED |
| 31 | Void button visible for INITIATED/COMPLETED | `isVoidable()` check at [`PaymentLedger.tsx:L155`](file:///d:/rootgrain%20website/_extracted/src/app/%28storefront%29/admin/orders/%5Bid%5D/PaymentLedger.tsx#L155) | ✅ VERIFIED |
| 32 | Void button hidden for FAILED/REFUNDED/VOIDED | `isVoidable()` returns false | ✅ VERIFIED |
| 33 | Confirmation modal present | Modal at [`PaymentLedger.tsx:L222-L244`](file:///d:/rootgrain%20website/_extracted/src/app/%28storefront%29/admin/orders/%5Bid%5D/PaymentLedger.tsx#L222-L244) | ✅ VERIFIED |
| 34 | Client submits only paymentRecordId + idempotencyKey | FormData at [`PaymentLedger.tsx:L139-L140`](file:///d:/rootgrain%20website/_extracted/src/app/%28storefront%29/admin/orders/%5Bid%5D/PaymentLedger.tsx#L139-L140) | ✅ VERIFIED |

#### Migration
| # | Test | Evidence | Result |
|---|------|----------|--------|
| 35 | Only VOIDED added to PaymentStatus | [`migration.sql`](file:///d:/rootgrain%20website/_extracted/prisma/migrations/20260826140000_phase8_slice2_payment_voiding/migration.sql) | ✅ VERIFIED |
| 36 | No other tables/enums affected | Migration is single ALTER TYPE statement | ✅ VERIFIED |
| 37 | Idempotent via IF NOT EXISTS | `ADD VALUE IF NOT EXISTS` used | ✅ VERIFIED |

#### Gateway Boundary
| # | Test | Evidence | Result |
|---|------|----------|--------|
| 38 | No external API calls | No Stripe/bKash/bank imports or calls in void path | ✅ VERIFIED |

#### Regression
| # | Test | Evidence | Result |
|---|------|----------|--------|
| 39 | `recordPayment` untouched | Method body unchanged | ✅ VERIFIED |
| 40 | `payment.admin.ts` untouched | File unchanged | ✅ VERIFIED |
| 41 | Phase 7 actions untouched | `custom-request.ts` unchanged | ✅ VERIFIED |
| 42 | Phase 6 MTO service untouched | `mto-admin.service.ts` unchanged | ✅ VERIFIED |

#### Build Verification
| # | Test | Command | Result |
|---|------|---------|--------|
| 43 | TypeScript | `npx tsc --noEmit` | ✅ PASS (0 errors) |
| 44 | ESLint | `npx eslint` | ✅ PASS (0 errors, 12 warnings) |
| 45 | Build | `npm run build` | ✅ PASS |

### Summary
- **45/45 checks verified**
- **Status**: AWAITING UAT / APPROVAL
