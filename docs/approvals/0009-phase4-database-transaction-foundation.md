# 0009-PHASE4-DATABASE-TRANSACTION-FOUNDATION
**SPECIFICATION & IMPLEMENTATION PLAN**

**Document:** docs/approvals/0009-phase4-database-transaction-foundation.md
**Status:** AWAITING EXPLICIT APPROVAL

## 1. PHASE 4 OBJECTIVE
Phase 4 establishes the DATABASE AND TRANSACTION FOUNDATION required by later phases. This phase is FOUNDATION ONLY. The goal is to safely establish the database model foundation, financial data integrity, transaction boundaries, row-level concurrency protection, idempotency, events, outbox, documents, non-destructive constraints, and legacy compatibility at the schema level. 

This phase MUST NOT implement business workflows belonging to later phases.

## 2. AUTHORITATIVE SOURCES
1. `docs/approvals/0006-phase2-financial-document-and-event-rules.md` (Business / Financial Contract)
2. `docs/approvals/0007-phase1-existing-system-compatibility-audit.md` (Current System Baseline)
3. `docs/approvals/0008-phase3-repository-data-architecture-mapping.md` (Repository Mapping + Phase 4 Foundation Inputs)

## 3. CURRENT DATABASE EVIDENCE
The current repository uses PostgreSQL, managed via Prisma ORM (`prisma/schema.prisma`).
All existing monetary fields (`Order.total`, `Order.advancePaid`, `PaymentRecord.amount`, `OrderItem.unitPrice`, `OrderItem.total`) consistently use Integer minor units.

## 4. CURRENT SCHEMA AUDIT
A deep audit of `prisma/schema.prisma` reveals:
- **Order:** Contains `advancePaid`, `balanceDue`, `total`, `discountAmount`. `Order` -> `OrderItem` and `Order` -> `PaymentRecord` relations currently use `onDelete: Cascade`.
- **PaymentRecord:** Uses `PaymentPhase` enum (`ADVANCE`, `SETTLEMENT`).
- **PromoCode:** Exists, but there is no `PromoUsage` model tracking historical usages.
- **AuditLog:** Exists for Admin RBAC, not financial transactional events.
- **Shipping/Delivery:** Managed via `ShippingRate` directly, no explicit Delivery object.
- **Documents/Notifications:** No existing models.

## 5. DATABASE CHANGE INVENTORY
| Existing Model | Required Change | Reason | Risk | Migration Strategy |
|---|---|---|---|---|
| `Order` | Add `requiredAdvance`, `productionState` enum, `deliveryState` enum. | Foundation requirement for MTO/Delivery. | Low | Add optional/defaulted columns. |
| `Order` | Remove `onDelete: Cascade` for `OrderItem` & `PaymentRecord`. | Prevent financial history destruction. | High | Alter relation to `RESTRICT`. |
| `PaymentRecord` | Alter `type` to use target enum. | Alignment with Phase 2 contract. | High | Pre-verify legacy data, then migrate. |
| `OrderItem` | Remove `onDelete: Cascade` from Order relation. | Prevent financial history destruction. | Medium | Alter relation to `RESTRICT`. |

## 6. ORDER FOUNDATION
Phase 4 extends `Order` strictly for foundation requirements.
**New Fields:** `requiredAdvance` (Int), `productionState` (Enum), `deliveryState` (Enum).
- `requiredAdvance` MUST use the exact same safe monetary representation as existing financial amount fields (Integer minor units).

**ENUM VALUES (Verified from Phase 3 Contract):** 
- `productionState`: `NOT_STARTED`, `IN_PROGRESS`, `COMPLETE`
- `deliveryState`: `TBD`, `FINALIZED`, `OUT_FOR_DELIVERY`, `DELIVERED_AND_COLLECTED`

*Phase 4 MUST use only enum values verified from the authoritative Phase 2/Phase 3 contract. Any additional enum value requires a new explicit architectural decision and approval. Do NOT invent new values.*

**Legacy Fields:** `advancePaid`, `balanceDue`, `total` remain as derived projections. They MUST NOT become independent financial truth.
**Target Architecture:**
- `PaymentRecord` = canonical actual payment facts.
- `Financial Domain Service` = authority for financial calculations/projections.
- `Order` fields = derived projections where retained.

## 7. ORDER.total FOUNDATION
**Semantics:** `Order.total` = CURRENT KNOWN PAYABLE PROJECTION.
When Delivery = TBD, `Order.total` stores the known payable projection. Delivery charge MUST NOT be invented while TBD. When Delivery is finalized, `Order.total` updates to include the final delivery charge.
**Rules:** Payment, Payment Void, and Final Invoice issuance MUST NOT modify `Order.total`. Price Revision and Delivery Charge Finalization MAY modify `Order.total`. 

## 8. PAYMENT ENUM MIGRATION & FOUNDATION
**Current Enum:** `PaymentPhase` (`ADVANCE`, `SETTLEMENT`).
**Target Enum:** `PaymentType` (`ADVANCE`, `INSTALLMENT`, `COD`).

**Verification Requirement:** RUNTIME DATA VERIFICATION REQUIRED.

--------------------------------------------------
### PAYMENT ENUM MIGRATION DECISION TREE
--------------------------------------------------
**STEP 1:** Query the production/runtime database for: `PaymentRecord.type = SETTLEMENT`

**STEP 2:**
**IF SETTLEMENT COUNT = 0:**
- No existing SETTLEMENT records.
- PaymentPhase → PaymentType migration may proceed.
- Target values: `ADVANCE`, `INSTALLMENT`, `COD`.
- SETTLEMENT may be removed only after schema/data validation passes.

**IF SETTLEMENT COUNT > 0:**
STOP. DO NOT automatically map SETTLEMENT → INSTALLMENT or COD. DO NOT delete SETTLEMENT. DO NOT rewrite historical `PaymentRecord.type` values.
Instead:
1. Identify all affected records.
2. Inspect their historical context.
3. Determine their actual business meaning.
4. Produce an explicit verified semantic mapping.
5. Create a migration plan for those records.
6. Obtain explicit approval for that mapping.
7. ONLY THEN continue enum migration.

## 9. PAYMENT MODEL SAFETY & DELETION PROHIBITION
`PaymentRecord` foundation requirements:
- Stable payment identity (`id` CUID), Order relation (`orderId`), Amount (`amount`).
- Payment type (`type` using new `PaymentType`). Status (`status`).

--------------------------------------------------
### PAYMENTRECORD LIFECYCLE & DELETION PROHIBITION
--------------------------------------------------
PaymentRecord represents financially material historical payment facts.
**Lifecycle:** `VALID` → `VOIDED` where applicable. NOT: `VALID` → `DELETED`.
A normal application workflow MUST NOT expose or perform: `DELETE PaymentRecord`.
This prohibition applies across: admin operations, customer operations, service layer, repository layer, API routes, background workers, maintenance jobs, scheduled cleanup, generic cascading deletion. No normal application path may hard-delete PaymentRecord.

**Two Independent Protections:**
- **PROTECTION A:** `Order` → `PaymentRecord` = `RESTRICT / NO ACTION`
- **PROTECTION B:** `PAYMENT_RECEIPT` → `PaymentRecord` historical reference protection. 
Because `OrderDocument.referenceIdentity` is polymorphic, Protection B may not be represented by a direct database FK in Phase 4. Therefore:
  - `PaymentReceipt` creation MUST verify `PaymentRecord` exists.
  - `PaymentRecord` MUST NOT be hard-deleted.
  - Any future repository/service deletion path MUST reject deletion.
  - A dangling `PAYMENT_RECEIPT` reference MUST be treated as a data-integrity violation.
(Do NOT pretend a polymorphic FK exists).

## 10. ORDERITEM FOUNDATION
Current `OrderItem` stores historical `unitPrice` and `total`. Deleting an `Order` currently cascades to `OrderItem`.
**Required Delete Behavior:** `Order` -> `OrderItem` relation MUST be changed to `onDelete: Restrict` to prevent destruction of financially material historical order data.

## 11. ORDER EVENT MODEL & SEQUENCE ALLOCATION
**Model:** `OrderEvent`
**Conceptual fields:** `id`, `orderId`, `sequence`, `eventType`, `payload`, `actor`, `occurredAt`.
**Sequence Allocation Strategy:**
The sequence allocation MUST be protected by the `Order` aggregate lock.
- `START TX` -> `LOCK Order aggregate` -> `READ current maximum event sequence` -> `sequence = current maximum + 1` -> `INSERT OrderEvent` -> `COMMIT`.
- Do NOT rely solely on `MAX(sequence) + 1` without the Order aggregate lock. Concurrent transactions targeting the same Order MUST serialize through the lock.
**Invariant Backstop:** `UNIQUE(orderId, sequence)`.
**Event Type Restriction:** `eventType` strictly restricted to the frozen Phase 2 contract.

**Order Event Delete Safety:**
Committed OrderEvent records are immutable historical records. They MUST NOT be hard-deleted as part of normal Order lifecycle operations. (Order lifecycle should use cancel, archive, void where applicable).

## 12. EVENT PAYLOAD & ACTOR IDENTITY
**Payload Storage:** JSON column. Immutable historical facts.
**Actor Identity Semantics:**
- `actor` JSON: `{ type, id, name }`.
- `actor.type` + `actor.id` = Authoritative historical actor identity.
- `actor.name` = Historical display snapshot ONLY. Must not be used as authoritative identity.
- Allowed actor types: `CUSTOMER`, `ADMIN`, `SYSTEM`.

## 13. IDEMPOTENCY RESULT REPLAY CONTRACT & ATOMICITY
**Model:** `IdempotencyKey`
**Conceptual fields:** `id`, `scope`, `key`, `requestFingerprint`, `resultType`, `resultReference`, `createdAt`, `expiresAt`.

--------------------------------------------------
### ATOMIC IDEMPOTENCY INVARIANT
--------------------------------------------------
For transactional business mutations:
Idempotency state + Business mutation + Event + Outbox + Transactional document snapshot + Result reference MUST be committed atomically in the SAME DATABASE TRANSACTION.
If the transaction rolls back:
- no business mutation remains
- no event remains
- no outbox record remains
- no document snapshot remains
- no completed idempotency result remains
If the transaction commits: all required records become durable together.

--------------------------------------------------
### IDEMPOTENCY DECISION CONTRACT
--------------------------------------------------
For a request: `(scope, key, requestFingerprint)`

**CASE A:** No existing IdempotencyKey exists.
→ claim idempotency key → execute business transaction → store resultType → store resultReference → commit

**CASE B:** Existing record found AND fingerprint is identical.
→ DO NOT execute business mutation again
→ return/replay the original result identified by: `resultType + resultReference`

**CASE C:** Existing record found AND fingerprint differs.
→ IDEMPOTENCY_CONFLICT
→ DO NOT execute business mutation.

--------------------------------------------------
### CONCURRENT REQUEST & IDEMPOTENCY CLAIM CONCURRENCY
--------------------------------------------------
`UNIQUE(scope, key)` is the database-level protection.
For concurrent identical requests (T1, T2): Only one idempotency record may succeed. T2 MUST NOT create a second idempotency record. The implementation MUST safely resolve the race according to actual Prisma/PostgreSQL transaction behavior. If the winning transaction has not committed yet, the losing request MUST NOT incorrectly assume a completed result. It must safely retry/read according to the verified transaction strategy.

**Idempotency Result Safety:**
A result may be replayed ONLY when: the idempotency record is committed, resultType exists, resultReference exists, and the referenced business result exists and is readable.

**Retention / Expiry Policy:**
For financially material operations, idempotency records MUST remain available for the required replay-protection window. Automatic expiry (`expiresAt`) MUST NOT silently allow the same client idempotency key to create a second financial mutation.

--------------------------------------------------
### IDEMPOTENCY CONCURRENCY PROTOTYPE
--------------------------------------------------
Before the shared Idempotency utility is approved for use by financial workflows, a technical prototype MUST verify actual:
- PostgreSQL behavior
- installed Prisma version behavior
- transaction isolation
- unique constraint conflict behavior
- interactive transaction behavior
- rollback behavior
- retry behavior

The prototype MUST test at minimum:
**TEST A:** T1 and T2 submit the SAME scope + key + fingerprint concurrently. Expected: only one committed IdempotencyKey, only one business mutation, second request safely replays the committed result, no duplicate financial mutation.
**TEST B:** T1 and T2 submit the SAME scope + key but DIFFERENT fingerprints. Expected: only one request may execute the business mutation, other request returns IDEMPOTENCY_CONFLICT, no second financial mutation.
**TEST C:** T1 claims idempotency key but transaction ROLLS BACK. T2 then retries the same key. Expected: T2 can safely become the valid claimant, no phantom successful idempotency result remains, no duplicate business mutation.
**TEST D:** T1 successfully commits. T2 arrives after commit with the same fingerprint. Expected: T2 does NOT execute business mutation, T2 replays the original result.
**TEST E:** T1 successfully commits. T2 arrives after commit with a different fingerprint. Expected: IDEMPOTENCY_CONFLICT, no business mutation.
**TEST F:** Business mutation fails after idempotency claim. Expected: entire transaction rolls back, no completed idempotency result, no business mutation, no event, no outbox, no document snapshot.
**TEST G:** Outbox insert fails after mutation/event creation. Expected: entire transaction rolls back, no partial committed business state.

*(The exact Prisma implementation MUST be determined from the actual repository version. Do NOT invent an unverified Prisma error-handling pattern during specification).*
**Phase 4 financial workflow implementation MUST NOT consume the shared Idempotency utility until the concurrency prototype passes all required scenarios. If prototype fails: PHASE 4 IMPLEMENTATION BLOCKED until corrected and re-tested.**

## 14. FINANCIAL AGGREGATE LOCK FOUNDATION
Phase 2 requires transactional financial aggregate locking on the `Order` aggregate.
- **Database Provider:** PostgreSQL.
- **Target Technical Lock Mechanism:** Row-level `FOR UPDATE` locking (e.g., `SELECT * FROM "Order" WHERE id = $1 FOR UPDATE`), subject to verification against the installed Prisma version and transaction API before implementation.

--------------------------------------------------
### SHARED ORDER AGGREGATE LOCK
--------------------------------------------------
The Order aggregate lock MUST be implemented as ONE SHARED FOUNDATION PRIMITIVE.
It MUST be reused by future financial/concurrency-sensitive workflows: Payment, Payment Void, Price Revision, Required Advance Revision, Delivery Charge Finalization, Final Invoice, CustomRequest Conversion, OrderEvent sequence allocation.
Do NOT create separate homemade locking implementations for each workflow. Phase 4 establishes the shared locking utility. Later phases consume it.

## 15. NOTIFICATION OUTBOX FOUNDATION & DELETE SAFETY
**Model:** `NotificationOutbox`
**Reference Integrity:**
- `eventReference` = `OrderEvent.id`. Preserves referential integrity.
- `businessAggregateReference` = `Order.id`.
**Required Uniqueness:** ONE BUSINESS EVENT + ONE NOTIFICATION TYPE + ONE CHANNEL = ONE LOGICAL DELIVERY. Constraint: `UNIQUE(eventReference, notificationType, channel)`.

**OrderEvent → NotificationOutbox Delete Safety:**
- Delete behavior: `OrderEvent` → `NotificationOutbox` = `RESTRICT / NO ACTION` (NOT CASCADE).
- Reason: `OrderEvent` is immutable historical business evidence. `NotificationOutbox` is historical delivery intent/processing evidence. Deleting an `OrderEvent` MUST NOT silently destroy `NotificationOutbox` history. `NotificationOutbox` MUST NOT be allowed to exist with an invalid `OrderEvent` reference.

## 16. ORDER DOCUMENT FOUNDATION & INTEGRITY
**Model:** `OrderDocument`

--------------------------------------------------
### ORDERDOCUMENT IMMUTABILITY & SNAPSHOT CONTENT
--------------------------------------------------
After an OrderDocument is committed:
- `snapshot` MUST NOT be updated.
- `documentType` MUST NOT be changed.
- `referenceIdentity` MUST NOT be changed.
- `orderId` MUST NOT be changed.
- `templateVersion` MUST NOT be changed.
- `createdAt` MUST NOT be changed.
- `createdBy` MUST NOT be changed.

A committed historical document is **INSERT-ONLY historical evidence.** If a correction/replacement is required: DO NOT UPDATE the existing historical document. Create a new appropriate document/revision according to the business contract.

**Document Snapshot Content:** The snapshot must contain the historical facts required to reproduce/understand the document at issuance time. It MUST NOT rely on future mutable reads of: `Product`, `Order`, `PaymentRecord`, `PromoCode`, `Delivery`, or `Customer profile` for historical reconstruction. This preserves historical truth.

**Immutability Enforcement Strategy:**
Must be enforced through the strongest verified repository/database mechanism appropriate to the actual stack (e.g., repository/service layer mutation prohibition, dedicated read-only historical repository interface, database trigger, database permissions, etc.). At minimum: No normal update method may exist for committed historical OrderDocument fields.

**Document Delete Safety:**
Committed historical OrderDocument records MUST NOT be hard-deleted as part of normal application lifecycle. Especially `ORDER_CONFIRMATION`, `PAYMENT_RECEIPT`, `PRICE_REVISION`, `FINAL_INVOICE` must remain historically traceable. Deletion should be `RESTRICT / prohibited` where the document represents committed business evidence.

--------------------------------------------------
### REFERENCE IDENTITY DESIGN
--------------------------------------------------
`OrderDocument.referenceIdentity` is intentionally polymorphic during Phase 4. Its meaning is determined by `documentType`.

| documentType | referenceIdentity must identify |
|---|---|
| ORDER_CONFIRMATION | existing Order (`Order.id`) |
| PAYMENT_RECEIPT | existing PaymentRecord (`PaymentRecord.id`) |
| PRICE_REVISION | future PriceRevision (`future PriceRevision.id`) |
| FINAL_INVOICE | existing Order (`Order.id`) |

Phase 4 database enforcement: document-type-specific uniqueness, Order relation through orderId, referenceIdentity format/usage validated by application contract. 

**PRICE_REVISION Document Reference Safety:**
Phase 4 MUST NOT create a PriceRevision FK because PriceRevision does not exist yet. Phase 4 stores stable `referenceIdentity` and enforces document-type-specific uniqueness. Phase 5 MUST: create the model, validate all existing `PRICE_REVISION` documents, establish referential integrity, and prevent deletion of referenced `PriceRevision` records.

**Conditional Unique Index Strategy:**
Target: PostgreSQL partial unique indexes (e.g., `UNIQUE(orderId) WHERE documentType = ORDER_CONFIRMATION`). If Prisma cannot express partial indexes directly, use a custom SQL migration component.

## 17. DELETE / CASCADE SAFETY & HARD-DELETE POLICY
**Order Hard-Delete Policy:** An `Order` containing financially material historical records MUST NOT be hard-deleted. Future lifecycle should use: cancel, archive, void.

--------------------------------------------------
### COMPLETE RELATIONSHIP SAFETY MATRIX
--------------------------------------------------
| Relationship | Current State | Phase 4 Target | Delete Policy |
|---|---|---|---|
| Order → OrderItem | CASCADE | RESTRICT / NO ACTION | Preserve history |
| Order → PaymentRecord | CASCADE | RESTRICT / NO ACTION | Preserve financial history |
| Order → OrderEvent | N/A — new model | RESTRICT / NO ACTION | Immutable history |
| Order → OrderDocument | N/A — new model | RESTRICT / NO ACTION | Immutable history |
| OrderEvent → NotificationOutbox | N/A — new model | RESTRICT / NO ACTION | Preserve delivery evidence |

*(Do NOT alter unrelated legitimate cascades).*

**Additional Protections:**
- `PaymentRecord`: no normal hard delete.
- `PaymentRecord` referenced by `PAYMENT_RECEIPT`: deletion prohibited.
- `Committed OrderEvent`: NO NORMAL HARD DELETE.
- `Committed OrderDocument`: NO NORMAL HARD DELETE.
- Future `PriceRevision` referenced by `PRICE_REVISION`: deletion prohibited in Phase 5.

## 18. TRANSACTION FOUNDATION CONTRACT — FINAL FORM

--------------------------------------------------
### AUTHORIZATION / TRANSACTION BOUNDARY
--------------------------------------------------
`AUTHORIZATION DECISION`
↓
`BEGIN DATABASE TRANSACTION`
↓
`IDEMPOTENCY CLAIM / CHECK`
↓
`LOCK ORDER AGGREGATE`
↓
`READ CANONICAL STATE`
↓
`VALIDATE`
↓
`MUTATE`
↓
`CREATE IMMUTABLE DOCUMENT SNAPSHOT`
↓
`CREATE ORDER EVENT`
↓
`CREATE OUTBOX`
↓
`STORE IDEMPOTENCY RESULT`
↓
`COMMIT`

All transactional records above MUST commit atomically.
- **Authorization I/O:** Authorization logic that requires external I/O or network calls MUST NOT be performed while holding the financial database transaction open. The decision is established before the transaction.
- **Authorization + Idempotency Security Rule:** Authorization MUST occur before a request can claim or mutate a financial idempotency record. Unauthorized requests MUST NOT be able to successfully reserve a financial idempotency key in a way that prevents the legitimate authorized request from executing.
- **External Systems:** Post-commit only (PDF rendering, Cloudinary, Email, WhatsApp, payment providers, external APIs, network calls).

## 19. PRE-MIGRATION vs POST-MIGRATION AUDITS

--------------------------------------------------
### PRE-MIGRATION EXISTING DATA AUDIT
--------------------------------------------------
Before Phase 4 migration, inspect ONLY currently existing models/data.
Required checks include:
1. Existing `OrderItem` rows
2. Existing `PaymentRecord` rows
3. Existing `Order` rows
4. Existing foreign-key relationships
5. Existing orphaned records
6. Existing invalid/null values that would violate new constraints
7. Existing duplicate values that would violate new constraints
8. Existing `PaymentPhase` values, especially `SETTLEMENT`
9. Existing data that could conflict with new enum/field constraints

For new Phase 4 models:
- `OrderEvent` → N/A — new model, no legacy rows expected
- `OrderDocument` → N/A — new model, no legacy rows expected
- `NotificationOutbox` → N/A — new model, no legacy rows expected
- `IdempotencyKey` → N/A — new model, no legacy rows expected
Do NOT query nonexistent current tables as if they contain legacy records.

--------------------------------------------------
### POST-MIGRATION NEW-MODEL INTEGRITY AUDIT
--------------------------------------------------
After creating the new Phase 4 tables, verify:
- `OrderEvent` foreign keys
- `OrderEvent` sequence uniqueness
- `OrderDocument` foreign keys/identity rules
- `NotificationOutbox` → `OrderEvent` integrity
- `NotificationOutbox` logical uniqueness
- `IdempotencyKey` uniqueness
- All new `NOT NULL`/default constraints

## 20. ROLLBACK STRATEGY & VERIFIED BACKUP REQUIREMENT
**Primary Production Recovery Strategy:**
1. Verified pre-migration backup/snapshot.
2. Restore procedure available.
3. Migration applied.
4. Post-migration verification.
5. If unrecoverable failure occurs: restore verified backup/snapshot.
6. If correction is possible without restore: use forward corrective migration.
*Rollback MUST NOT depend on an untested manually written reverse migration.*

**Verified Backup + Restore Requirement:**
Phase 4 implementation MUST NOT be approved for production migration unless `BACKUP → RESTORE → INTEGRITY VERIFICATION → APPROVAL` has been demonstrated.

## 21. MIGRATION ORDERING
1. Verified backup + restore
2. Runtime data inspection
3. **PRE-MIGRATION EXISTING DATA AUDIT** (Verify no orphaned `OrderItem`, `PaymentRecord`. Verify no invalid FKs, null values, duplicates, or rows conflicting with new enums). Migration MUST NOT proceed if integrity violations are found.
4. Pre-migration uniqueness/constraint audit
5. Add nullable/default-safe foundation fields
6. Add foundation tables
7. Add safe indexes/constraints
8. Handle Payment enum migration
9. Validate all migrated rows
10. Apply RESTRICT relationship changes
11. Enforce final strict constraints
12. **POST-MIGRATION NEW-MODEL INTEGRITY AUDIT**
13. Prisma schema/migration state verification

## 22. TEST FOUNDATION PLAN
A. `OrderEvent` concurrent sequence allocation.
B. Idempotency: same key + same fingerprint → same result.
C. Idempotency: same key + different fingerprint → conflict.
D. Financial idempotency retention behavior.
E. Partial document uniqueness.
F. Outbox eventReference integrity.
G. Outbox logical delivery uniqueness.
H. Order hard-delete prevention.
I. Verified backup/restore.
J. Payment enum migration (with no SETTLEMENT rows, and with SETTLEMENT rows present).
K. `Order.total` foundation field behavior.
L. Transaction lock wait/serialization.
M. IdempotencyKey + Business Mutation atomicity.
N. Business Mutation + Idempotency atomicity.
O. Event + Outbox atomicity.
P. OrderEvent → NotificationOutbox delete protection.
Q. No orphan NotificationOutbox.

## 23. PHASE 4 IMPLEMENTATION BOUNDARY
**PHASE 4 MAY IMPLEMENT:** Prisma schema foundation, database constraints, indexes, migrations, transaction utility, Order aggregate locking utility, idempotency persistence, OrderEvent persistence, NotificationOutbox persistence, OrderDocument persistence, safe delete restrictions, required foundation fields.
**PHASE 4 MUST NOT IMPLEMENT:** Payment business workflow, Payment Void, Price Revision, Required Advance Revision, Final Invoice issuance workflow, MTO workflow, CustomRequest workflow, Admin UI, Customer UX, PDF generation, Email/WhatsApp workers, Delivery workflow, Promo workflow.

## 24. RISK REGISTER
*(Includes RISK-01 to RISK-18 specifying critical migration, concurrency, structural integrity, enum, backup, and external provider risks).*

## 25. FINAL CONSISTENCY AUDIT
**CHECK 01:** Exact productionState values are verified from authoritative sources or explicitly marked NOT VERIFIED.
**CHECK 02:** Exact deliveryState values are verified from authoritative sources or explicitly marked NOT VERIFIED.
**CHECK 03:** No enum values were invented.
**CHECK 04:** PaymentRecord has no normal hard-delete lifecycle.
**CHECK 05:** PaymentRecord deletion is prohibited across normal application paths.
**CHECK 06:** Order → PaymentRecord = RESTRICT / NO ACTION.
**CHECK 07:** PAYMENT_RECEIPT requires an existing PaymentRecord.
**CHECK 08:** Referenced PaymentRecord cannot be deleted.
**CHECK 09:** Idempotency concurrency prototype is mandatory before shared utility approval.
**CHECK 10:** Same key + same fingerprint → one mutation + replay.
**CHECK 11:** Same key + different fingerprint → conflict.
**CHECK 12:** Rollback after idempotency claim leaves no successful idempotency result.
**CHECK 13:** Committed OrderDocument is immutable.
**CHECK 14:** Committed OrderDocument cannot be normally deleted.
**CHECK 15:** Historical document fields cannot be updated.
**CHECK 16:** Document snapshot preserves historical facts independently of mutable future records.
**CHECK 17:** Order aggregate lock remains shared.
**CHECK 18:** Event sequence allocation uses shared Order lock.
**CHECK 19:** External systems remain post-commit.
**CHECK 20:** Pre-migration audit only covers existing models.
**CHECK 21:** Post-migration audit covers new models.
**CHECK 22:** Verified backup/restore remains mandatory.
**CHECK 23:** No later-phase workflow is implemented.
**CHECK 24:** No Phase 4 implementation has started.

## 26. PHASE 4 GATE

PHASE 4 GATE:
READY FOR IMPLEMENTATION

STATUS:
AWAITING EXPLICIT APPROVAL
