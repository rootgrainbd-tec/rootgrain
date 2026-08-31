# ROOTGRAIN — FINANCIAL ARCHITECTURE RED-TEAM AUDIT

**Document:** 0005-FINANCIAL-REDTEAM-AUDIT.md  
**Status:** RED-TEAM PASS — READY FOR 0005R1

## SAFE ASSUMPTIONS
- **Order Total Immutability:** Admin UI (`OrdersTable.tsx`) and `OrderService` do not expose any method to mutate `subtotal`, `shippingCost`, or `discountAmount` post-creation. The total is functionally immutable.
- **Promo/Shipping Snapshots:** Promos and shipping calculations securely resolve to static integer fields (`discountAmount`, `shippingCost`) at checkout. Future config changes will not mutate historical orders.
- **Admin Authorization:** Server action `updateOrderStatus` in `src/app/actions/admin.ts` is protected by `requireAdmin()`.
- **Email Asynchrony:** `OrderService.updateOrderStatus` dispatches the email using a `.catch()` block. Email failure does not roll back the database transaction.

## UNSAFE ASSUMPTIONS
- **`advancePaid` as Cache:** 0005 proposed using `advancePaid` as a cache for total payments. This is unsafe without database-level transactions. Concurrent admin updates could result in a read-modify-write race condition, silently losing payment ledger sums.
- **CONFIRMED = Payment Received:** The system currently hard-couples `CONFIRMED` status to entering an `advanceAmount` in the UI. This is inflexible and conflates logistical confirmation with financial settlement.
- **Order Status Implies Financial State:** Treating `CANCELLED` as a financial reversal is unsafe. A cancelled order with recorded payments must retain those payments for audit and manual refund workflows.
- **20% Advance Requirement:** The 20% advance is purely a UI visual element. The database does not store an actual negotiated `advanceRequired` amount. It is impossible to know if an order is "financially compliant" without this field.

## CONTRADICTIONS
- **0005 Claimed:** A true payment ledger is missing.
  **Red-Team Finding:** The schema contains `PaymentRecord`, but it lacks essential provenance fields (`recordedBy`, generic `reference`) to function safely as a source of truth for manual entry.
- **Payment Method Coverage:** The schema allows `MANUAL_BKASH`, `BANK_TRANSFER`, `COD`. It is missing `CASH` and generic `OTHER`.
- **Reference Field:** The schema has `bkashTrxId @unique`. It lacks a generic `reference` field for bank transfers or cash receipts.

## MISSING EVIDENCE
- **Idempotency/Duplicate Prevention:** No mechanism exists to prevent an admin from double-clicking "Confirm Payment" and recording the same payment twice.
- **Transaction Boundaries:** `OrderService.updateOrderStatus` executes read and write operations sequentially without Prisma `$transaction`.

## FINANCIAL RISKS
- **Negative Balances:** `balanceDue = currentOrder.total - advancePaidAmount` allows negative balances if an admin accidentally types an amount greater than the total. No invariant checks exist.
- **Orphaned Payments on Cancellation:** If an order is CANCELLED, there is no system to mark associated payments as requiring refunds.
- **Undefined Advance Required:** Because `advanceRequired` is not stored, partial payments against negotiated advances cannot be programmatically validated.

## DATA MIGRATION RISKS
- **Historical Payment Fabrication:** Creating synthetic `PaymentRecord` rows for old orders with `advancePaid > 0` is risky without a generic `LEGACY` payment method.
- **Dual Source of Truth:** Transitioning from `advancePaid` to `PaymentRecord` sums risks cache desynchronization if historical data is not perfectly migrated.

## CONCURRENCY RISKS
- **Read-Modify-Write Race:** Two admins simultaneously confirming/recording payments for the same order will overwrite the `balanceDue` based on stale reads. Atomic Prisma operations (`increment`, `decrement`) or strict `$transaction` locking are mandatory.

## DOCUMENT RISKS
- **Synchronous PDF Blocking:** If `generateInvoicePDF` throws an error (e.g., missing font data), the entire `Resend` dispatch fails. Financial operations succeed, but the customer receives no notification.
- **Dynamic Payment Receipts:** If payment receipts are generated dynamically based on the *current* order state, they may reflect incorrect historical totals if generated after subsequent payments.

## NOTIFICATION RISKS
- **Document Duplication:** If an admin retries a failed PDF dispatch, they may inadvertently duplicate the financial payment record if the operations are not decoupled.

## SECURITY RISKS
- **Audit Obfuscation:** Because `PaymentRecord` lacks a `recordedBy` relation to the Admin User, there is no accountability for who recorded a manual cash or bKash payment.

## REQUIRED ARCHITECTURE CORRECTIONS
1. **Schema Extension:**
   - Add `advanceRequired Int?` to `Order` to store negotiated advance amounts.
   - Add `recordedById String?` to `PaymentRecord` for auditability.
   - Add `reference String?` to `PaymentRecord` and remove the strict `@unique` on `bkashTrxId` (or make it a broader `reference` field).
   - Add `CASH` and `OTHER` to `PaymentMethod` enum.
2. **Atomic Transactions:** Wrap payment creation and balance updates inside a `prisma.$transaction`.
3. **Idempotency:** Implement idempotency keys (e.g., `eventId` or `reference`) for payment recording to prevent double-click duplication.
4. **Decouple Logistics & Finance:** Allow `Order` status updates (PENDING -> CONFIRMED) to occur independently from `PaymentRecord` creation.
5. **Invariants Check:** Throw strict `ValidationError` if `totalPaid > total` or `balanceDue < 0`.
6. **PDF Isolation:** Wrap `generateInvoicePDF` in a `try/catch` and attach only if successful, falling back to HTML email.

## MINIMUM SAFE ARCHITECTURE
- **Order Model:** Add `advanceRequired`. Retain `total`, `balanceDue`, `advancePaid` (repurposed as `totalPaid` cache).
- **PaymentRecord Model:** Add provenance (`recordedBy`, `reference`).
- **Service Layer:** `PaymentService.recordPayment(orderId, amount, method, reference, adminId)` executing a `$transaction`.
- **Document Layer:** `ReceiptPDFGenerator` taking a specific `PaymentRecord` as immutable input.

## IMPLEMENTATION BLOCKERS
- None. The risks are identified and the required architecture corrections strictly map to Prisma model extensions and transaction wrappers.

---

**GO / NO-GO**
RED-TEAM PASS — READY FOR 0005R1
