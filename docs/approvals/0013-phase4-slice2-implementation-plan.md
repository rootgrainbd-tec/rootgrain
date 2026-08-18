# 0013-PHASE4-SLICE2-IMPLEMENTATION-PLAN
**SPECIFICATION & IMPLEMENTATION PLAN**

**Document:** docs/approvals/0013-phase4-slice2-implementation-plan.md
**Status:** AWAITING APPROVAL

## 1. AUTHORITATIVE BASELINE
1. `docs/approvals/0008-phase3-repository-data-architecture-mapping.md`
2. `docs/approvals/0009-phase4-database-transaction-foundation.md`
3. `docs/approvals/0010-phase4-implementation-preflight.md`
4. `docs/approvals/0011-phase4-migration-architecture-decision.md`
5. `docs/approvals/0012-phase4-bootstrap-remediation.md`
6. Latest Slice 1 forensic audit
7. Latest Slice 1 final adversarial verification report
8. Current 0013 Slice 2 implementation plan

## 2. PRESERVE SLICE 2 SCOPE
Slice 2 remains foundation-only. The scope is strictly limited to:
1. `IdempotencyKey` model and persistence.
2. `OrderEvent` model and persistence.
3. `OrderDocument` model and persistence.
4. `NotificationOutbox` model and persistence.
5. Prisma interactive transaction utility adapter.
6. Order aggregate `FOR UPDATE` lock primitive.
7. Idempotency enforcement logic.
8. Idempotency concurrency prototype.
9. Adversarial verification.

Slice 2 MUST NOT expand into business workflow implementation, Payment processing, Payment Void, Price Revision, Final Invoice, CustomRequest, MTO, PDF generation, Email delivery, or WhatsApp delivery.

## 3. IDEMPOTENCY TRANSACTION OWNERSHIP
**TRANSACTION OWNER:** CALLER / WORKFLOW
The caller workflow owns the transaction. The idempotency primitive does NOT own the outer transaction. The helper participates in the existing transaction and MUST NOT silently create a second independent transaction. 

## 4. CRITICAL — P2002 ORCHESTRATION MODEL
The orchestration model relies on the caller executing the transaction, and the idempotency helper throwing a dedicated internal domain signal when the exact expected unique constraint is hit.
**Conceptual Flow:**
1. Outer orchestration layer attempts `runInTransaction(tx)`.
2. Idempotency helper claims the key using `tx`.
3. If database `UNIQUE` constraint blocks and eventually returns `P2002`:
4. The helper throws a **DEDICATED IDEMPOTENCY CLAIM CONFLICT SIGNAL**.
5. The `runInTransaction` block is aborted and exited.
6. **OUTSIDE THE TRANSACTION**, the outer orchestration layer catches the signal.
7. The orchestration layer executes a Post-Transaction Recovery Read using a **GLOBAL / NON-ABORTED CLIENT**.
8. Fingerprint is verified. Replay or `IDEMPOTENCY_CONFLICT` is returned.

**CRITICAL INVARIANT:** The recovery read MUST NOT happen inside the original transaction callback. The recovery read MUST NOT use the aborted `TransactionClient`.

## 5. IDEMPOTENCY HELPER CONTRACT
The helper has two distinct conceptual responsibilities:
**A. TRANSACTIONAL CLAIM**
- **Uses:** `Prisma.TransactionClient`.
- **Responsibilities:** Create/inspect idempotency state as part of the caller's transaction. Detect the expected unique-key collision. Signal the collision. NEVER attempt to query using the aborted `tx` client after `P2002`.
**B. POST-TRANSACTION RECOVERY**
- **Uses:** Non-aborted Global Prisma Client.
- **Responsibilities:** Fetch existing `IdempotencyKey`. Verify `ownerType`, `ownerId`, `scope`, `key`, and `fingerprint`. Replay completed response or return `IDEMPOTENCY_CONFLICT`.

## 6. EXACT P2002 CLASSIFICATION
The recovery path MUST NOT treat every Prisma `P2002` as an idempotency conflict. We do not make the application dependent solely on a generated database constraint name. The expected target field set is authoritative. A generated database constraint name MAY be used as supplementary diagnostic evidence, but MUST NOT be the sole correctness dependency.

**Semantic Rule:**
EXPECTED IDEMPOTENCY P2002:
`P2002` + metadata target corresponds to `[ownerType, ownerId, scope, key]` = Idempotency claim conflict.

Any `P2002` whose target does NOT correspond to that exact field set:
→ normal `P2002`
→ propagate normally
→ MUST NOT enter idempotency replay/conflict recovery.

**PRISMA P2002 TARGET METADATA SHAPE:** REQUIRES IMPLEMENTATION-TIME VERIFICATION.

## 7. OWNER TYPE DATABASE ENFORCEMENT
To guarantee safe ownership discrimination at the database level, `ownerType` will use a native Prisma enum:
```prisma
enum IdempotencyOwnerType {
    USER
    GUEST
}
```
**GUEST OWNER SOURCE:** NOT SPECIFIED. If the current repository architecture does not yet expose a trusted guest identity mechanism, Slice 2 does not invent one.

## 8. IDEMPOTENCY STATUS ENFORCEMENT
To guarantee safe state lifecycle without invalid arbitrary strings, `status` will use a finite Prisma enum:
```prisma
enum IdempotencyStatus {
    IN_PROGRESS
    COMPLETED
}
```
## 9. NOTIFICATION OUTBOX STATUS ENFORCEMENT
Because Slice 2 only persists initial intent and delivery processing remains out of scope, the initial state is controlled by a finite enum representing the smallest authoritative representation:
```prisma
enum NotificationOutboxStatus {
    PENDING
}
```
## 10. FOREIGN KEY ON UPDATE POLICY
The RootGrain repository default convention for non-specified updates in relation fields natively defaults to Prisma's `Cascade`. Because the referenced aggregate identities (`cuid` PKs) are strictly immutable, cascading acts safely as a no-op. To maintain absolute consistency with the existing schema repository conventions, relations explicitly declare `onDelete: Restrict` and omit `onUpdate` to fallback to `Cascade`, yielding: `ON UPDATE CASCADE`. This logic applies consistently to `OrderEvent.orderId`, `OrderDocument.orderId`, `NotificationOutbox.orderId`, and `NotificationOutbox.eventReference`.

## 11. EVENT PAYLOAD DATA GOVERNANCE CONTRACT
`OrderEvent.payload` and `OrderEvent.actor` (both `Json`) represent the historical event data explicitly required by the foundation contract. 
**Minimum Safety Contract:** `payload` and `actor` MUST contain sanitized application data only. They MUST NOT contain passwords, authentication credentials, access tokens, refresh tokens, private keys, secrets, or unnecessary sensitive data. 
**EVENT PAYLOAD SIZE / RETENTION:** NOT SPECIFIED FOR SLICE 2. Do not invent limits.
We do NOT invent event names or business event schemas.

## 12. RESULT REFERENCE vs RESPONSE PAYLOAD
- **`resultReference`:** The canonical reference to the business result, when one exists (e.g. `Order.id`).
- **`responsePayload`:** The sanitized replay response required to cleanly reproduce the original idempotent HTTP response.
**Precedence for Retry Replay:**
If `responsePayload` is present and is the approved replay representation, return the sanitized `responsePayload`. `resultReference` MAY identify the canonical business result but MUST NOT silently override an explicitly stored replay payload. 
If `responsePayload` is absent: **REPLAY WITHOUT RESPONSE PAYLOAD: NOT SPECIFIED FOR SLICE 2.** Do NOT invent a fallback mechanism. 
`resultReference` and `responsePayload` MUST NOT contain secrets.

## 13. OWNER ID TRUST BOUNDARY
**Security Invariant:** `ownerType` and `ownerId` MUST come from trusted server-side application context (e.g., verified session). They MUST NOT be accepted as arbitrary client-controlled inputs.

## 14. IN_PROGRESS FINAL RULE
**`IN_PROGRESS` is transaction-internal only.**
A committed row MUST NEVER remain `IN_PROGRESS`. No crash-recovery protocol may depend on a committed `IN_PROGRESS` row. No separate committed "claim transaction" is allowed. 

## 15. NOTIFICATION OUTBOX — EVENT FK
**Foreign Keys & Indexes:** 
- `NotificationOutbox.eventReference` → `OrderEvent.id` (ON DELETE RESTRICT).
- `NotificationOutbox.orderId` → `Order.id` (ON DELETE RESTRICT).
The eventReference target is completely unambiguous.

## 16. OUTBOX UNIQUE CONSTRAINT
`@@unique([eventReference, notificationType, channel])`.
For one Event + NotificationType + Channel, there can be only ONE delivery-intent record. Retries update/reuse this same record. 

## 17. ORDERDOCUMENT REFERENCE CONTRACT
- `orderId` is the authoritative aggregate owner.
- `referenceIdentity` is intentionally polymorphic.
- There is NO DATABASE FK from `referenceIdentity`.
- `documentType` is an application-level discriminator.
**DOCUMENT TYPE VOCABULARY:** NOT SPECIFIED FOR SLICE 2. We do not invent document types.

## 18. ORDEREVENT
- Event identity is `OrderEvent.id`.
- `eventType` = `String`.
- **EVENT TYPE VOCABULARY:** NOT SPECIFIED FOR SLICE 2.
- `OrderEvent` is strictly append-only. No update API, no hard-delete API.

## 19. EVENT SEQUENCE
- **Sequence Allocation:** Order row lock → read `MAX(sequence)` → `sequence + 1` → create `OrderEvent`.
- The lock MUST be held inside the exact same transaction.
- **Safety Net:** `@@unique([orderId, sequence])` remains the absolute database safety net. Do NOT introduce an Order counter field.

## 20. TRANSACTION CLIENT LEAKAGE & NESTED POLICY
**Invariant:** Any database operation executed as part of a transactional workflow MUST receive and use `Prisma.TransactionClient`. The global Prisma client MUST NOT be used inside the transactional workflow.
**Nested Policy:** NESTED TRANSACTIONS: NOT SUPPORTED BY API CONTRACT. 
A function that receives `Prisma.TransactionClient` MUST NOT invoke `runInTransaction()`. Nested transactions are prohibited by API contract, transaction ownership discipline, code review, and static verification. Do NOT introduce `AsyncLocalStorage` or runtime transaction detection.

## 21. ATOMIC TRANSACTION CONTRACT
Reference ordering (only applies when all listed components are required):
Lock Order → Idempotency claim → Read canonical state → Validate → Mutate → Document → Event → Outbox → Complete idempotency → Commit.
No external I/O may occur inside the transaction. ALL uncommitted foundation state rolls back upon failure.

## 22. BACKUP / RECOVERY
- **HISTORICAL SLICE 0 BACKUP:** NOT VERIFIABLE.
- **NEW PRE-SLICE-2 BACKUP:** Required before Slice 2 migration implementation. This MUST NOT be represented as evidence of the historical backup.
- **PRE-SLICE-2 BACKUP/RESTORE PROCEDURE:** NOT VERIFIED. (This becomes a mandatory implementation precondition).

## 23. MIGRATION RECOVERY
- `prisma migrate resolve` ≠ rollback.
- Applied migrations are strictly immutable.
- Already-applied schema changes require forward corrective migration.
- Destructive recovery requires a verified backup/restore.

## 24. MIGRATION DESIGN — FINAL REVIEW
*(Migration NOT CREATED until 0013 is approved)*
- **`Enum IdempotencyOwnerType`**: `USER`, `GUEST`.
- **`Enum IdempotencyStatus`**: `IN_PROGRESS`, `COMPLETED`.
- **`Enum NotificationOutboxStatus`**: `PENDING`.
- **`IdempotencyKey`**: `id` (String PK), `ownerType` (`IdempotencyOwnerType`), `ownerId` (String), `scope` (String), `key` (String), `fingerprint` (String), `status` (`IdempotencyStatus`, default IN_PROGRESS), `resultReference` (String?), `responsePayload` (Json?), `createdAt` (DateTime), `updatedAt` (DateTime). 
  - Unique: `@@unique([ownerType, ownerId, scope, key])`.
- **`OrderEvent`**: `id` (String PK), `orderId` (String), `sequence` (Int), `eventType` (String), `payload` (Json), `actor` (Json), `occurredAt` (DateTime).
  - FK: `Order` (`fields: [orderId], references: [id], onDelete: Restrict, onUpdate: Cascade`).
  - Unique: `@@unique([orderId, sequence])`.
- **`OrderDocument`**: `id` (String PK), `orderId` (String), `documentType` (String), `referenceIdentity` (String), `snapshot` (Json), `templateVersion` (String), `createdBy` (String), `createdAt` (DateTime).
  - FK: `Order` (`fields: [orderId], references: [id], onDelete: Restrict, onUpdate: Cascade`).
- **`NotificationOutbox`**: `id` (String PK), `eventReference` (String), `orderId` (String), `notificationType` (String), `channel` (String), `status` (`NotificationOutboxStatus`, default PENDING), `attempts` (Int), `lastError` (String?), `nextAttemptAt` (DateTime?), `processedAt` (DateTime?), `createdAt` (DateTime), `updatedAt` (DateTime).
  - FK: `OrderEvent` (`fields: [eventReference], references: [id], onDelete: Restrict, onUpdate: Cascade`).
  - FK: `Order` (`fields: [orderId], references: [id], onDelete: Restrict, onUpdate: Cascade`).
  - Unique: `@@unique([eventReference, notificationType, channel])`.

## 25. FINAL ADVERSARIAL TESTS

**DATABASE & RUNTIME BEHAVIOR TESTS:**
- **TEST 1**: Same idempotency key + same fingerprint concurrently
  - SCENARIO: Two identical requests arrive simultaneously.
  - EXPECTED: T1 commits, T2 unblocks, P2002 intercepted, replays T1 response exactly.
- **TEST 2**: Same idempotency key + different fingerprint concurrently
  - SCENARIO: Two requests with same key but different fingerprints arrive simultaneously.
  - EXPECTED: T1 commits, T2 unblocks, P2002 intercepted, throws `IDEMPOTENCY_CONFLICT`.
- **TEST 3**: Failed original transaction
  - SCENARIO: Business logic fails or throws inside the transaction.
  - EXPECTED: Original transaction rolls back cleanly, no `IN_PROGRESS` claim remains orphaned.
- **TEST 4**: Retry after failed transaction
  - SCENARIO: Request retried after previous transaction rolled back.
  - EXPECTED: Retry successfully establishes a new `IN_PROGRESS` claim and executes.
- **TEST 5**: Client disconnect after successful commit
  - SCENARIO: Network disconnects before response is sent, client retries.
  - EXPECTED: Identical retry securely replays the original deterministic payload.
- **TEST 6**: Two concurrent Order mutations
  - SCENARIO: Two different workflows mutate the same Order simultaneously.
  - EXPECTED: Row lock strictly serializes the execution according to database transaction rules.
- **TEST 7**: Concurrent event creation / sequence allocation
  - SCENARIO: Two events are appended to the same Order.
  - EXPECTED: Row lock serializes the sequence fetch, assigning monotonically sequential numbers without gaps.
- **TEST 8**: Rollback after Event/Outbox creation attempt
  - SCENARIO: Transaction aborts after writing event/outbox intent.
  - EXPECTED: Rollback clears all intermediate state cleanly (Atomicity guarantees no orphan foundation rows).
- **TEST 10**: Nonexistent Order lock
  - SCENARIO: Workflow attempts to lock an Order ID that does not exist.
  - EXPECTED: Lock query deterministically throws `NOT_FOUND`.
- **TEST 15**: Migration/schema verification
  - SCENARIO: Apply Phase 4 Slice 2 Prisma migration.
  - EXPECTED: Migration SQL is purely additive, correctly checksummed, and applied without data destruction.
- **TEST 16**: Different owner + same scope + same key
  - SCENARIO: Two different users submit the same idempotency key.
  - EXPECTED: No cross-owner replay. No false conflict. Unique constraint isolates them.
- **TEST 17**: Expected `IdempotencyKey` P2002
  - SCENARIO: Idempotency claim encounters exact unique constraint violation.
  - EXPECTED: Transaction aborts, recovery reads via global client strictly outside the transaction.
- **TEST 18**: Unrelated P2002
  - SCENARIO: Transaction encounters a unique constraint violation on a different model/field.
  - EXPECTED: NOT an idempotency recovery. Normal database error propagation.
- **TEST 19**: Committed `IdempotencyKey` status
  - SCENARIO: Inspect completed idempotency row in database.
  - EXPECTED: Never returns `IN_PROGRESS`.
- **TEST 20**: `NotificationOutbox.eventReference`
  - SCENARIO: Create outbox intent targeting nonexistent event ID.
  - EXPECTED: FK validation strictly fails, guaranteeing it points to a valid `OrderEvent.id`.
- **TEST 21**: Document reference contract test
  - SCENARIO: Create document with specific polymorphic identity.
  - EXPECTED: `orderId` FK exists; `referenceIdentity` is accepted as an opaque polymorphic identity with no FK; no unsupported document type vocabulary is invented.
- **TEST 22**: Client attempts to provide another owner's `ownerId`
  - SCENARIO: Malicious authenticated request supplies different user ID.
  - EXPECTED: Trusted server-side owner identity wins. No cross-owner claim/replay.

**STATIC ARCHITECTURAL / CODE-REVIEW TESTS:**
- **TEST 9**: Multi-aggregate locking boundary
  - SCENARIO: A future workflow would require locking multiple Order aggregates.
  - EXPECTED: Slice 2 provides no multi-aggregate locking abstraction and makes no universal deadlock-prevention guarantee. Any future multi-aggregate workflow MUST define its own approved deterministic lock ordering before implementation.
  - VERIFICATION: Static/code review.
- **TEST 11**: Isolated test environment
  - SCENARIO: Execution of adversarial tests.
  - EXPECTED: All tests execute in a clean, disposable local target, not touching production.
  - VERIFICATION: Environment configuration review.
- **TEST 12**: TransactionClient propagation audit
  - SCENARIO: Review transactional repository/service calls.
  - EXPECTED: Every database operation belonging to the transaction uses the supplied `Prisma.TransactionClient`. Global Prisma client usage inside the transactional workflow violates the approved architecture. No automatic runtime enforcement is claimed.
  - VERIFICATION: Static/code review.
- **TEST 13**: Nested transaction policy
  - SCENARIO: A transaction-aware function receiving `Prisma.TransactionClient` attempts to invoke `runInTransaction()`.
  - EXPECTED: The pattern violates the approved transaction API contract and is detected through static/code-level architectural verification. No runtime exception guarantee is claimed.
  - VERIFICATION: Static/code-level architectural verification.
- **TEST 14**: External I/O exclusion
  - SCENARIO: Review transactional workflow implementation for external network or delivery calls.
  - EXPECTED: No external I/O is present inside the database transaction. No runtime blocking mechanism is claimed.
  - VERIFICATION: Static/code-level architectural audit.
- **TEST 23**: Response payload sanitization audit
  - SCENARIO: Review the idempotency payload provided by the caller workflow.
  - EXPECTED: No secrets, tokens, or credentials are leaked in the idempotency state.
  - VERIFICATION: Static/code review.

## 26. RISK REGISTER
| Risk | Probability | Impact | Mitigation | Verification |
|---|---|---|---|---|
| Invalid IdempotencyStatus | Low | High | Enum `IdempotencyStatus` DB constraint | Schema |
| Invalid Outbox status | Low | Medium | Enum `NotificationOutboxStatus` restriction | Schema |
| Event payload sensitive-data leakage | Medium| High | Sanitization boundary by caller workflow | Test 23 |
| Actor metadata leakage | Low | Medium | Explicit governance against auth token logging | Review |
| Replay payload inconsistency | Low | High | Precedence strictly prefers explicitly stored `responsePayload` | Architecture|
| Unsupported DB verification claim | Low | Medium | Explicit separation of Git and DB claims in spec | Review |
| Test-definition incompleteness | Low | Medium | Tests 1-23 fully explicitly detailed in spec | Review |

## 27. ZERO-IMPLEMENTATION VERIFICATION
**A. Git-verifiable claims:** (Verified via `git status --short`)
- Verified: `0013-phase4-slice2-implementation-plan.md` exclusively updated.
- Verified: `prisma/schema.prisma` completely unchanged.
- Verified: No migration created.
- Verified: Source unchanged.
- Verified: Tests unchanged.
- Verified: Package files unchanged.
- Verified: Supabase files unchanged.
- Verified: No commit, no push, no deploy.

**B. Database-state claims:**
- **DATABASE STATE:** NOT VERIFIED IN THIS SPECIFICATION PASS.

## 28. DOCUMENT STATUS
STATUS:
AWAITING APPROVAL
