# Phase 8 Slice 3 — Advance Revision
## UAT Verification Report

**Status**: AWAITING UAT / APPROVAL

### Evidence Matrix

#### RBAC
| # | Test | Evidence | Result |
|---|------|----------|--------|
| 1 | `requirePermission("advance.revise")` invoked before mutation | [`advance-revision.admin.ts:26`](file:///d:/rootgrain%20website/_extracted/src/app/actions/advance-revision.admin.ts#L26) | ✅ VERIFIED |
| 2 | `session.role === "ADMIN"` NOT used | New action file contains no role check | ✅ VERIFIED |
| 3 | `actorId` NOT accepted from client | Service API: `{ orderId, newRequiredAdvance, reason, idempotencyKey }` only | ✅ VERIFIED |
| 4 | Actor derived from `getServerSession()` | [`payment.service.ts:L468`](file:///d:/rootgrain%20website/_extracted/src/services/payment.service.ts#L468) | ✅ VERIFIED |

#### VALIDATION
| # | Test | Evidence | Result |
|---|------|----------|--------|
| 5 | Negative advance rejected | `newRequiredAdvance < 0` check at [`payment.service.ts:L481`](file:///d:/rootgrain%20website/_extracted/src/services/payment.service.ts#L481) + Zod `.min(0)` | ✅ VERIFIED |
| 6 | Advance > total rejected | `newRequiredAdvance > currentOrder.total` at [`payment.service.ts:L541`](file:///d:/rootgrain%20website/_extracted/src/services/payment.service.ts#L541) | ✅ VERIFIED |
| 7 | Invalid input rejected | `Number.isInteger()` check + Zod `.int()` | ✅ VERIFIED |
| 8 | Empty reason rejected | `!reason || !reason.trim()` check at [`payment.service.ts:L484`](file:///d:/rootgrain%20website/_extracted/src/services/payment.service.ts#L484) + Zod `.min(1)` | ✅ VERIFIED |

#### REVISION SCENARIOS
| # | Test | Evidence | Result |
|---|------|----------|--------|
| 9 | Increase advance | No upper-bound-below-advancePaid restriction exists | ✅ VERIFIED |
| 10 | Decrease advance | No lower-bound restriction (only >= 0) | ✅ VERIFIED |
| 11 | Advance = 0 | Zod `.min(0)` allows 0; service allows 0 | ✅ VERIFIED |
| 12 | Advance = total | `<= total` check allows equality | ✅ VERIFIED |
| 13 | New advance < advancePaid | No `>= advancePaid` check exists (deliberately allowed) | ✅ VERIFIED |
| 14 | New advance = advancePaid | Allowed (no restriction) | ✅ VERIFIED |
| 15 | New advance > advancePaid | Allowed (standard case) | ✅ VERIFIED |
| 16 | Repeated revision | No single-use restriction; each gets unique idempotency key | ✅ VERIFIED |

#### FINANCIAL ZERO-DELTA
| # | Test | Evidence | Result |
|---|------|----------|--------|
| 17 | `Order.total` unchanged | `tx.order.update` data contains ONLY `requiredAdvance` at [`payment.service.ts:L571-L573`](file:///d:/rootgrain%20website/_extracted/src/services/payment.service.ts#L571-L573) | ✅ VERIFIED |
| 18 | `Order.advancePaid` unchanged | Not modified in revision path | ✅ VERIFIED |
| 19 | `Order.balanceDue` unchanged | Not modified in revision path | ✅ VERIFIED |
| 20 | Payment history unchanged | No `PaymentRecord` queries (except 0) in revision | ✅ VERIFIED |
| 21 | No negative values | `newRequiredAdvance >= 0` enforced; no other financial field touched | ✅ VERIFIED |

#### PRODUCTION THRESHOLD
| # | Test | Evidence | Result |
|---|------|----------|--------|
| 22 | `productionState` unchanged | Not modified in revision path | ✅ VERIFIED |
| 23 | `Order.status` unchanged | Not modified in revision path | ✅ VERIFIED |
| 24 | Threshold semantics preserved | `startProduction` still checks `authoritativePaid >= requiredAdvance` | ✅ VERIFIED |

#### AUDIT EVENT
| # | Test | Evidence | Result |
|---|------|----------|--------|
| 25 | `REQUIRED_ADVANCE_MODIFIED` event created | `appendOrderEvent` call at [`payment.service.ts:L577-L587`](file:///d:/rootgrain%20website/_extracted/src/services/payment.service.ts#L577-L587) | ✅ VERIFIED |
| 26 | Previous value preserved | `previousAdvance` in payload | ✅ VERIFIED |
| 27 | New value preserved | `newAdvance` in payload | ✅ VERIFIED |
| 28 | Actor preserved | `{ actorId, role: "ADMIN" }` | ✅ VERIFIED |
| 29 | Reason preserved | `reason: reason.trim()` in payload | ✅ VERIFIED |

#### IDEMPOTENCY
| # | Test | Evidence | Result |
|---|------|----------|--------|
| 30 | Same-key replay | `existingKey.status === "COMPLETED"` returns stored `responsePayload` | ✅ VERIFIED |
| 31 | Same-key conflicting payload | `existingKey.fingerprint !== fingerprint` throws 409 | ✅ VERIFIED |
| 32 | Different-key concurrent | Order FOR UPDATE serializes | ✅ VERIFIED |

#### CONCURRENCY
| # | Test | Evidence | Result |
|---|------|----------|--------|
| 33 | Revision + revision serializes | `SELECT FOR UPDATE` at [`payment.service.ts:L535`](file:///d:/rootgrain%20website/_extracted/src/services/payment.service.ts#L535) | ✅ VERIFIED |
| 34 | Revision + payment recording serializes | Same `Order FOR UPDATE` lock used | ✅ VERIFIED |
| 35 | Revision + payment void serializes | Same `Order FOR UPDATE` lock used | ✅ VERIFIED |
| 36 | No lost update | FOR UPDATE guarantees exclusive lock | ✅ VERIFIED |

#### ORDER ELIGIBILITY
| # | Test | Evidence | Result |
|---|------|----------|--------|
| 37 | `PENDING_ADVANCE` + `NOT_STARTED` → allowed | `ELIGIBLE_STATUSES` array at [`payment.service.ts:L548`](file:///d:/rootgrain%20website/_extracted/src/services/payment.service.ts#L548) | ✅ VERIFIED |
| 38 | `CONFIRMED` + `NOT_STARTED` → allowed | Included in `ELIGIBLE_STATUSES` | ✅ VERIFIED |
| 39 | Production-started → rejected | `productionState !== "NOT_STARTED"` check at [`payment.service.ts:L554`](file:///d:/rootgrain%20website/_extracted/src/services/payment.service.ts#L554) | ✅ VERIFIED |
| 40 | Unsupported status → rejected | Not in `ELIGIBLE_STATUSES` → throws 400 | ✅ VERIFIED |

#### SECURITY
| # | Test | Evidence | Result |
|---|------|----------|--------|
| 41 | Spoofed total has no effect | Validated against locked `currentOrder.total` | ✅ VERIFIED |
| 42 | Spoofed advancePaid impossible | Not accepted by API | ✅ VERIFIED |
| 43 | Spoofed balanceDue impossible | Not accepted by API | ✅ VERIFIED |
| 44 | Spoofed actorId impossible | Derived from `getServerSession()` | ✅ VERIFIED |

#### REGRESSION
| # | Test | Evidence | Result |
|---|------|----------|--------|
| 45 | Phase 7 intact | Custom Request actions untouched | ✅ VERIFIED |
| 46 | Slice 1 RBAC intact | `requirePermission` library untouched | ✅ VERIFIED |
| 47 | Slice 2 payment void intact | `voidPayment` method untouched | ✅ VERIFIED |
| 48 | Phase 6 MTO intact | `mto-admin.service.ts` untouched | ✅ VERIFIED |
| 49 | Standard checkout intact | `checkout.service.ts` untouched | ✅ VERIFIED |

#### ADMIN UI
| # | Test | Evidence | Result |
|---|------|----------|--------|
| 50 | Edit button visible for eligible orders | `canReviseAdvance` computed property | ✅ VERIFIED |
| 51 | Reason field present | `advanceReason` state + input field | ✅ VERIFIED |
| 52 | Confirmation modal present | `showAdvanceConfirm` state + modal | ✅ VERIFIED |
| 53 | "(Locked - Payment Received)" removed | Text removed from UI | ✅ VERIFIED |
| 54 | Idempotency key generated | `uuidv4()` on mount + refresh | ✅ VERIFIED |

#### BUILD VERIFICATION
| # | Test | Command | Result |
|---|------|---------|--------|
| 55 | TypeScript | `npx tsc --noEmit` | ✅ PASS (0 errors) |
| 56 | ESLint | `npx eslint` | ✅ PASS (0 errors, 21 warnings) |
| 57 | Build | `npm run build` | ✅ PASS |

### Summary
- **57/57 checks verified**
- **Status**: AWAITING UAT / APPROVAL
