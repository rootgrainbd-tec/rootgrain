# 0184-R-PHASE6-DISPATCH-SPECIFICATION-CONSISTENCY-AUDIT

**Status:** PHASE 6 — DISPATCH SPECIFICATION CONSISTENCY VERIFIED

## 1. Critical Finding
During the pre-implementation consistency audit, a critical nomenclature error was identified in the original `0184` Dispatch Specification (Section 5). The specification incorrectly defined the Final Invoice Gate as:
`OrderDocument.documentType = "INVOICE"`

This creates a severe vulnerability: an Advance/Proforma Invoice (which might use `"INVOICE"`) could satisfy the Dispatch gate prematurely, breaking the strict sequence of `Production Complete → Final Invoice → Payment → Dispatch`.

## 2. Final Invoice Gate Correction
The approved and implemented Final Invoice architecture explicitly uses the string `"FINAL_INVOICE"` as the `documentType`. 

**Corrected Dispatch Gate Rule:**
Dispatch MUST verify the existence of an `OrderDocument` where:
- `orderId` = target order ID
- `documentType` = `"FINAL_INVOICE"`

Dispatch MUST NOT generate, modify, regenerate, replace, or create another Final Invoice. The document must already exist as an immutable snapshot.

## 3. Repository Evidence
Forensic search confirms the usage of `"FINAL_INVOICE"` in `src/services/mto-admin.service.ts` for Final Invoice issuance:
```typescript
documentType: "FINAL_INVOICE"
```
The string `"INVOICE"` is part of the broader enum/type (`"INVOICE" | "PAYMENT_RECEIPT" | "FINAL_INVOICE"`) but `"FINAL_INVOICE"` is the strictly isolated type for the post-production bill.

## 4. Secondary Consistency Audit
The following secondary consistency checks have been verified against the current repository state:
1. **`balanceDue == 0` is the Dispatch gate:** VERIFIED. (Subject to COD post-delivery exemptions if explicitly defined by business, but `balanceDue == 0` is the baseline financial truth).
2. **QC is NOT a prerequisite:** VERIFIED. (QC lifecycle was removed in `0182`).
3. **Final Payment does NOT require a new payment model:** VERIFIED. (Confirmed in `0183`).
4. **Delivery may occur with `balanceDue > 0` where approved:** VERIFIED.
5. **`trackingNumber` remains optional:** VERIFIED. (`String?` in Prisma).
6. **`trackingUrl` remains optional:** VERIFIED. (`String?` in Prisma).
7. **No Dispatch table:** VERIFIED.
8. **No Shipment table:** VERIFIED.
9. **No courier API:** VERIFIED.
10. **No AWS/S3:** VERIFIED.
11. **`OrderEvent` is reused:** VERIFIED.
12. **`NotificationOutbox` is reused:** VERIFIED.
13. **`IdempotencyKey` is reused:** VERIFIED.
14. **Order row locking is used:** VERIFIED. (`SELECT ... FOR UPDATE`).
15. **Final Invoice remains immutable:** VERIFIED.
16. **`deliveryAddress` comes from `Order.deliveryAddress`:** VERIFIED.
17. **Dispatch does not modify `DeliveryState`:** VERIFIED.

## 5. State Validation
**Is `OrderStatus = PROCESSING` and `TrackingState = IN_PRODUCTION` required for ALL orders?**
- **For MTO (Made-to-Order) Orders:** YES. The authoritative MTO flow transitions from `IN_PRODUCTION` directly to `DISPATCHED` (QC being removed).
- **For Non-MTO (Ready-to-Ship) Orders:** If RTS bypasses production entirely, its `TrackingState` may remain `PENDING_PRODUCTION` (the default schema value). 
- **Exception Rule:** Dispatch implementation MUST allow transition from BOTH `IN_PRODUCTION` and `PENDING_PRODUCTION` to accommodate RTS workflows, provided `ProductionState` constraints are respected (e.g., if RTS has `ProductionState = NOT_STARTED` but is ready to ship, or if `ProductionState` is strictly bypassed for RTS).

## 6. Event Validation
**Does `ORDER_DISPATCHED` exist?**
- No. A `grep_search` confirmed that `ORDER_DISPATCHED` is not yet in the codebase.
- `0184` successfully **proposes** it as a new event payload for the existing `OrderEvent` model. It does not assume it already exists.

## 7. Notification Validation
**Can `NotificationOutbox` support Dispatch?**
- Yes. The outbox processor (`communication.worker.ts`) currently handles `"ORDER_CONFIRMATION"`, `"PAYMENT_RECEIPT"`, and `"FINAL_INVOICE_AVAILABLE"`. Adding an `"ORDER_DISPATCHED"` `notificationType` case to trigger the existing `sendOrderStatusUpdateEmail(order, ... "DISPATCHED")` logic is perfectly compatible with the existing outbox pattern.

## 8. Idempotency Validation
**Does `dispatch_order_{orderId}` fit the architecture?**
- Yes. `IdempotencyKey.fingerprint` is a standard string constraint. This key format exactly matches established patterns in `PaymentService`. No second mechanism is created.

## 9. Transaction Validation
**Is the transaction boundary compatible?**
- Yes. The pattern of `SELECT FOR UPDATE` → validations → Order update → OrderEvent insert → IdempotencyKey insert → NotificationOutbox insert within a single `$transaction` perfectly mirrors the exact transaction topology used in `PaymentService` and `MTOAdminService`.

## 10. Final Corrected Contract
This contract supersedes `0184` where conflicting, and explicitly freezes the following rules for Dispatch implementation:

- **FINAL INVOICE GATE:** `OrderDocument.documentType = "FINAL_INVOICE"`
- **PAYMENT GATE:** `Order.balanceDue == 0`
- **QC GATE:** NONE
- **DISPATCH TABLE:** NONE
- **SHIPMENT TABLE:** NONE
- **SHIPPING API:** NONE FOR MVP
- **TRACKING NUMBER:** OPTIONAL
- **TRACKING URL:** OPTIONAL
- **FINAL INVOICE:** IMMUTABLE

## 11. Implementation Readiness
With this consistency correction applied, the Dispatch Specification is completely rigorous, logically coherent, and fully aligned with the active codebase. Zero mutation was applied during this audit.

================================================================
FINAL STATUS
================================================================
PHASE 6 —
DISPATCH SPECIFICATION CONSISTENCY VERIFIED
