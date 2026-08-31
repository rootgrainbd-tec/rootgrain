# 0008-PHASE3-REPOSITORY-DATA-ARCHITECTURE-MAPPING
**FINAL 3-BLOCKER REMEDIATION PASS**

**Document:** docs/approvals/0008-phase3-repository-data-architecture-mapping.md
**Status:** AWAITING EXPLICIT APPROVAL

## 1. PHASE 3 OBJECTIVE
Map every Phase 2 contract requirement to the actual current repository architecture. Classify each requirement as REUSE, EXTEND, REFACTOR, NEW, DEPRECATE, or CONFLICT to provide the precise blueprint for Phase 4 (Database Foundation) and beyond. No implementation is performed in this phase.

## 2. AUTHORITATIVE SOURCES
1. `docs/approvals/0006-phase2-financial-document-and-event-rules.md` (Target Contract)
2. `docs/approvals/0007-phase1-existing-system-compatibility-audit.md` (Current Baseline)

## 3. CANONICAL ROADMAP
The target implementations are assigned precisely to the following frozen roadmap:
- **PHASE 0:** Project Freeze, Evidence & Safety Gate
- **PHASE 1:** Existing System Compatibility Audit
- **PHASE 2:** Financial & Business Contract Freeze
- **PHASE 3:** Repository & Data Architecture Mapping
- **PHASE 4:** Database / Transaction Foundation
- **PHASE 5:** Normal Order Financial Workflow
- **PHASE 6:** MTO / Made-to-Order Engine
- **PHASE 7:** Custom Order Request System
- **PHASE 8:** Unified Admin Order Management
- **PHASE 9:** Documents & Communication
- **PHASE 10:** Customer Experience & UX
- **PHASE 11:** Promo, Delivery & Secondary-System Integration
- **PHASE 12:** Adversarial QA / Full Regression
- **PHASE 13:** Release, Backup & Production Verification

## 4. PAYMENT ENUM MIGRATION
**Current Evidence:** `PaymentPhase` in `prisma/schema.prisma` contains `ADVANCE` and `SETTLEMENT`. 
- `SETTLEMENT` semantic usage in current source code: **NOT VERIFIED / UNUSED IN SOURCE**.
- Runtime/database record existence: **NOT VERIFIED**.

**Target New PaymentType:**
- `ADVANCE`
- `INSTALLMENT`
- `COD`

**Migration Decision:** Phase 4 migration MUST first verify actual runtime database usage before changing or removing `SETTLEMENT`. If legacy `SETTLEMENT` records exist, they MUST NOT be silently reclassified without a verified semantic mapping.

## 5. VALID PAID & LEGACY COMPATIBILITY
**New Architecture:**
`PaymentRecord` is the SINGLE CANONICAL FINANCIAL SOURCE of actual payment facts. Valid Paid strictly excludes VOIDED payments. 

**Legacy Orders:**
For legacy orders without PaymentRecords, the existing financial fields represent a **LEGACY FINANCIAL SNAPSHOT** (a historical compatibility projection).
- This legacy snapshot is a historical compatibility source ONLY. It is NOT the canonical source for new financial mutations.
- The system MUST NOT fabricate PaymentRecords, historical events, or historical receipts.
- Future query layers must use this explicitly identified legacy compatibility projection to preserve historical financial values. 
- If a legacy order enters the new financial workflow, the transition behavior MUST be explicitly defined in Phase 5 before implementation.

## 6. FINANCIAL PROJECTION OWNERSHIP & Order.total
**Financial Projections:** `advancePaid` and `balanceDue` are derived projections. 

**Order.total Semantic Role:** `Order.total` represents the **CURRENT KNOWN PAYABLE PROJECTION** while delivery is TBD. It MUST NOT include an invented delivery charge and MUST NOT be interpreted as Final Payable while Delivery = TBD.
Example: Product Price = ৳100,000, Discount = ৳5,000, Delivery = TBD.
Then: Order.total = ৳95,000 (Known Current Payable), Final Payable = UNKNOWN.
When Delivery becomes FINALIZED, `Order.total` is updated to include the Final Delivery Charge.
`Order.total` is NEVER an independent financial truth, historical payable, or canonical paid amount. `PaymentRecord` remains canonical for actual paid money.

**Order.total Mutation Matrix:**
| Operation | Order.total changes? | Reason |
|---|---|---|
| Order Creation + Discount Lock | YES | Initialize current known payable using locked discount |
| Payment Received | NO | Payment changes Valid Paid, not payable |
| Payment Void | NO | Payment validity changes, payable unchanged |
| Price Revision | YES | Product payable changes |
| Required Advance Revision | NO | Advance requirement changes, payable unchanged |
| Delivery Charge Finalization | YES | Final payable changes |
| Final Invoice Issued | NO | Invoice snapshots current state; does not mutate payable |

**Central Authority:** A dedicated `Financial Domain Service` MUST own all projection updates. 
`Order.total` MUST NEVER be independently edited by UI/admin code. Only the Financial Domain Service may update it as part of an atomic financial mutation.

## 7. FINANCIAL AGGREGATE LOCK
**Requirement:** FINANCIAL AGGREGATE LOCK = transactional row-level locking of the `Order` financial aggregate.
- **Aggregate:** `Order`.
- **Purpose:** Prevent concurrent financial mutations from using stale state.
- **Required By:** Payment, Payment Void, Price Revision, Required Advance Revision, Delivery Charge Update, Final Invoice, CustomRequest Conversion.
- **Implementation:** The exact Prisma/PostgreSQL lock implementation MUST be technically validated in Phase 4.

## 8. DOCUMENT SNAPSHOT VS PDF GENERATION
**Decision:** Absolute separation of concerns.
- **Immutable Document Snapshot:** An `OrderDocument` JSON record is written to the database inside the atomic business transaction.
- **PDF Rendering & Delivery:** A post-commit background worker reads the snapshot to render the PDF and deliver it via email/WhatsApp. Financial database commits MUST NOT depend on PDF rendering, Cloudinary, or email providers.

## 9. ORDER DOCUMENT MODEL & UNIQUENESS
**Model:** `OrderDocument`.
**Required Conceptual Fields:** `id`, `orderId`, `documentType`, `referenceIdentity`, `snapshot`, `templateVersion`, `createdAt`, `createdBy`.

**Explicit Reference Identity:**
`referenceIdentity` MUST be stable and MUST identify the business object whose immutable snapshot is represented.
- **ORDER_CONFIRMATION:** `referenceIdentity` = orderId
- **PAYMENT_RECEIPT:** `referenceIdentity` = paymentId
- **FINAL_INVOICE:** `referenceIdentity` = orderId
- **PRICE_REVISION:** `referenceIdentity` = priceRevisionId

**Uniqueness Rules (Target constraint intent):**
- **ORDER_CONFIRMATION:** conditional uniqueness by order + document type
- **PAYMENT_RECEIPT:** conditional uniqueness by payment reference + document type
- **FINAL_INVOICE:** conditional uniqueness by order + document type
- **PRICE_REVISION:** unique revision identity

The exact PostgreSQL/Prisma implementation remains Phase 4.

## 10. PAYMENT RECEIPT IDENTITY
One completed `PaymentRecord` generates exactly one immutable `PAYMENT_RECEIPT` document.
**Voided Payment:** The original receipt remains immutable. The payment status becomes `VOIDED`. Valid Paid excludes it. No replacement receipt is created. No refund workflow is implemented.

## 11. PRICE REVISION IDENTITY & ARCHITECTURE
**PHASE 5 DOMAIN MODEL:** `PriceRevision` = dedicated business record.
A `PriceRevision` record represents ONE price revision operation.
- ONE Price Revision operation -> ONE `PriceRevision` identity -> ONE immutable `PRICE_REVISION` OrderDocument -> ONE `PRICE_REVISED` OrderEvent.
- Multiple `PriceRevision` records are allowed per Order.
- The `PriceRevision` identity MUST be stable and unique.

**Architecture Boundary:**
- Phase 5 creates and owns the `PriceRevision` business model and logic.
- Phase 4 does NOT implement `PriceRevision` business logic or its domain model. Phase 4 only establishes the generic foundation required for future support (`OrderEvent`, `OrderDocument`, `IdempotencyKey`, `NotificationOutbox`, required Order financial foundation).

## 12. CUSTOM REQUEST MODEL DECISION
**Current:** `Inquiry` model represents basic contact form data.
**Decision:** NEW `CustomRequest` model (PHASE 7 DEPENDENCY). `Inquiry` is too generic for the Phase 2 commercial contract.

## 13. MTO & DELIVERY STATE MAPPING
**TrackingState:** Current `TrackingState` is a legacy/conflated operational state. It is NOT automatically mapped to target states without evidence. 
**ProductionState:** ENUM. Values: `NOT_STARTED`, `IN_PROGRESS`, `COMPLETE`. Separate from `TrackingState`. 
**DeliveryState:** ENUM. Values: `TBD`, `FINALIZED`, `OUT_FOR_DELIVERY`, `DELIVERED_AND_COLLECTED`. Separate from `ProductionState`. 

## 14. EVENT TYPE CONTRACT & PAYLOAD TRACEABILITY
The database representation of `eventType` MUST be strictly restricted by application/domain validation to the frozen event contract.
`OrderEvent.payload` is the immutable historical event payload defined by Phase 2. It MUST NOT be reconstructed later from mutable Order/Product/Payment state.

| Event Type | Required Payload Contract |
|---|---|
| ORDER_CREATED | Phase 2 ORDER_CREATED payload |
| PAYMENT_RECEIVED | Phase 2 PAYMENT_RECEIVED payload |
| PAYMENT_VOIDED | Phase 2 PAYMENT_VOIDED payload |
| PRICE_REVISED | Phase 2 PRICE_REVISED payload |
| REQUIRED_ADVANCE_REVISED | Phase 2 REQUIRED_ADVANCE_REVISED payload |
| DELIVERY_CHARGE_UPDATED | Phase 2 DELIVERY_CHARGE_UPDATED payload |
| FINAL_INVOICE_ISSUED | Phase 2 FINAL_INVOICE_ISSUED payload |

**Conceptual OrderEvent fields:** `id`, `orderId`, `sequence`, `eventType`, `payload`, `actor`, `occurredAt`.

## 15. NOTIFICATION OUTBOX
**Conceptual Fields:** `id`, `businessAggregateReference`, `eventReference`, `eventType`, `notificationType`, `channel`, `payload`, `status`, `retryCount`, `createdAt`, `processedAt`, `nextRetryAt`, `lastError`, `logicalDeliveryIdentity`.
**Logical Delivery Uniqueness:** ONE BUSINESS EVENT + ONE NOTIFICATION TYPE + ONE CHANNEL = ONE LOGICAL OUTBOX DELIVERY.
The target architecture MUST enforce logical uniqueness equivalent to `UNIQUE(eventReference, notificationType, channel)` or an equivalent unique `logicalDeliveryIdentity`. The exact database index implementation is Phase 4. Multiple retry attempts are delivery attempts, NOT multiple logical notifications.

## 16. PROMO / DISCOUNT MAPPING
Locked discount is stored in `Order.discountAmount` and `Order.promoCode` at checkout. Historical documents and revisions MUST ALWAYS use the locked `Order.discountAmount` rather than re-evaluating the `PromoCode`.

## 17. PHASE 4 DATABASE FOUNDATION INPUT CONTRACT
Phase 4 MUST implement the following strictly at the schema level.

**Boundary Clarification:**
- **PHASE 4 MAY CREATE:** foundational `ProductionState` enum, foundational `DeliveryState` enum, required `Order` fields/indexes, and foundational transaction models (`OrderEvent`, `NotificationOutbox`, `IdempotencyKey`, `OrderDocument`).
- **PHASE 4 MUST NOT IMPLEMENT:** `PriceRevision` model (Phase 5), `CustomRequest` model (Phase 7), MTO workflow (Phase 6), production transitions, workshop logic, delivery workflow, shipping provider integration, OUT_FOR_DELIVERY behavior, Promo workflows, DELIVERED_AND_COLLECTED business logic. 

**Existing Models to Extend:**
- `Order`: Add `requiredAdvance`, `productionState` (Enum), `deliveryState` (Enum).
- `PaymentRecord`: Alter `type` to use updated `PaymentType` (Enum: ADVANCE, INSTALLMENT, COD). Remove `onDelete: Cascade`.
- `OrderItem`: Remove `onDelete: Cascade`.

**New Foundation Models:**
- `OrderEvent`: Implements the event type contract and `UNIQUE(orderId, sequence)`.
- `NotificationOutbox`: Implements the notification outbox fields and logical uniqueness.
- `IdempotencyKey`: Implements `UNIQUE(scope, key)`.
- `OrderDocument`: Implements conceptual fields and document uniqueness constraints.

## 18. BUSINESS TRANSACTION INPUT CONTRACT
All future financial mutations MUST strictly follow this exact sequence:

`START TX` → `AUTH` → `IDEMPOTENCY` → `FINANCIAL AGGREGATE LOCK` → `READ STATE` → `VALIDATE` → `MUTATE` → `DOCUMENT SNAPSHOT` → `EVENT` → `OUTBOX` → `COMMIT TX`

*(Note: Exact database locking mechanism and Prisma implementation is Phase 4. PDF rendering, Cloudinary, and external API calls are strictly POST-COMMIT.)*

## 19. TRACEABILITY & CHANGE CLASSIFICATION MATRIX

| Phase 2 Req ID | Phase 2 Rule | Current Location | Current Behavior | Target Architecture | Classification | Future Phase |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| FIN-001 | Canonical Financial State | `Order` model | Projections directly mutated | `PaymentRecord` is truth; `Financial Domain Service` updates projections | REFACTOR | Phase 5 |
| FIN-002 | Valid Paid vs Voided | MISSING | N/A | Excludes VOIDED records strictly | NEW | Phase 5 |
| FIN-003 | Overpayment Policy | MISSING | N/A | Validation inside `Financial Domain Service` | NEW | Phase 5 |
| PAY-001 | Payment Types | `PaymentPhase` | `SETTLEMENT` unverified | `ADVANCE`, `INSTALLMENT`, `COD` | EXTEND | Phase 4, 5 |
| PAY-002 | Payment Validation | MISSING | N/A | Amount limits inside TX | NEW | Phase 5 |
| PAY-003 | Payment Void | MISSING | N/A | Atomic void TX | NEW | Phase 5 |
| ADV-001 | Required Advance | `pdfGenerator.ts` | Hardcoded 20% | `Order.requiredAdvance` column | EXTEND | Phase 4, 5 |
| ADV-002 | Advance Revision Core | MISSING | N/A | Atomic financial mutation | NEW | Phase 5 |
| ADV-003 | Advance Revision UI | MISSING | N/A | Admin control surface | NEW | Phase 8 |
| PRC-001 | Price Revision Core | MISSING | N/A | `PriceRevision` domain model + Atomic financial mutation | NEW | Phase 5 |
| PRC-002 | Price Revision UI | MISSING | N/A | Admin control surface | NEW | Phase 8 |
| DEL-001 | Delivery TBD | `ShippingEngine` | Immediate calc | `DeliveryState`, TBD handling | REFACTOR | Phase 11 |
| MTO-001 | MTO Lifecycle | `TrackingState` | Conflated | `ProductionState` Enum | NEW | Phase 6 |
| CUS-001 | Custom Request | `Inquiry` | Basic form | New `CustomRequest` model | NEW | Phase 7 |
| DOC-001 | Immutable Documents | `pdfGenerator.ts` | Mutable PDF | `OrderDocument` JSON snapshot | NEW | Phase 9 |
| EVT-001 | Event Contract | `AuditLog` | Admin logs only | `OrderEvent` model & payloads | NEW | Phase 4, 5 |
| EVT-002 | Event Sequence | MISSING | N/A | `UNIQUE(orderId, sequence)` | NEW | Phase 4 |
| IDM-001 | Idempotency | MISSING | N/A | `IdempotencyKey` table | NEW | Phase 4 |
| OUT-001 | Outbox & Retry | `CheckoutService` | Inline emails | `NotificationOutbox` table + Worker | NEW | Phase 4, 9 |
| AUT-001 | Authorization Matrix | `admin.ts` | Basic role check | Formal Actor Matrix | EXTEND | Phase 8 |
| INV-001 | DB Invariants | `schema.prisma` | Cascade Deletes | Remove Cascade; Add Unique Indexes | CONFLICT | Phase 4 |
| LEG-001 | Legacy Compatibility | MISSING | N/A | Legacy compatibility projection logic | NEW | Phase 5 |

## 20. HIGH-RISK CHANGE REGISTER
- **RISK-01: Payment Enum Migration Ambiguity.** Evidence: Current source contains PaymentPhase values ADVANCE and SETTLEMENT. SETTLEMENT semantic usage in source is NOT VERIFIED / UNUSED IN SOURCE. Runtime/database record existence is NOT VERIFIED. Impact: Potential payment data corruption if SETTLEMENT is removed/reclassified without runtime verification. Mitigation: Phase 4 MUST verify actual runtime database usage before changing/removing SETTLEMENT. If SETTLEMENT records exist, determine verified historical semantics and define a migration/compatibility strategy before changing the enum. Do NOT silently reclassify.
- **RISK-02: Destructive Cascade.** Impact: Financial audit loss. Mitigation: Phase 4 schema update.
- **RISK-03: Data Loss via Inline Emails.** Impact: Lost notifications. Mitigation: Outbox pattern in Phase 4.
- **RISK-04: Hardcoded Advance.** Impact: Business rule violation. Mitigation: `requiredAdvance` field in Phase 4.
- **RISK-05: Legacy financial fallback.** Impact: Conflicting canonical financial semantics. Mitigation: Explicit LEGACY FINANCIAL SNAPSHOT compatibility layer.
- **RISK-06: Order.total semantic ambiguity.** Impact: Incorrect payable/balance calculation. Mitigation: Define Order.total as derived current known payable projection, not independent financial truth or final payable when Delivery=TBD.
- **RISK-07: Financial projection ownership.** Impact: Desynchronized advancePaid/balanceDue/total. Mitigation: Central Financial Domain Service exclusively updating projections.
- **RISK-08: Database lock implementation premature.** Impact: Incorrect transaction implementation. Mitigation: Phase 4 technical validation of the exact locking SQL.
- **RISK-09: Document Snapshot vs PDF Transaction Confusion.** Impact: Failed financial commits due to 3rd party API failures. Mitigation: Post-commit separation explicitly defined.
- **RISK-10: Document Uniqueness Ambiguity.** Impact: Multiple conflicting invoices. Mitigation: Explicit conditional unique index rules defined.
- **RISK-11: Production vs Delivery State Collision.** Impact: Invalid MTO transitions. Mitigation: Separated ENUM targets defined.
- **RISK-12: Locked Discount Reconstruction Risk.** Impact: Price changes over time. Mitigation: Re-use snapshotted `discountAmount`.

## 21. PHASE 3 GATE

PHASE 3 GATE:
READY FOR PHASE 4

STATUS:
AWAITING EXPLICIT APPROVAL
