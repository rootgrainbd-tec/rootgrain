# 0027 Phase 6: MTO Architectural Decisions

**Status:** APPROVED

## 1. Executive Summary
This document outlines the proposed architectural decisions for Phase 6 (Make-to-Order) based on the reconnaissance in ADR 0026 and incorporates authoritative business decisions provided by the project owners. It establishes the rules for MTO financial workflows, cart separation, and production state transitions, while strictly preserving Phase 5 payment architectures and the Phase 6/7 boundary.

Phase 6 specification remains BLOCKED until the final remaining architectural decisions are resolved.

---

## 2. Roadmap Reconciliation
This section explicitly maps the decisions in this document to the original RootGrain roadmap:

- 🟢 **DIRECTLY FROM ROADMAP:** Phase 6 = MTO / Made-to-Order Engine
- 🟢 **DIRECTLY FROM ROADMAP:** Phase 7 = Custom Order Request System
- 🟢 **DIRECTLY FROM ROADMAP:** Decoupling operational `TrackingState` from `ProductionState`
- 🟢 **DIRECTLY FROM ROADMAP:** Workshop / production operations workflows
- 🟡 **HUMAN BUSINESS DECISION / COMPATIBLE:** Available and MTO items in a mixed cart must result in separate Orders
- 🟡 **HUMAN BUSINESS DECISION / COMPATIBLE:** Default MTO advance is 30% of order total
- 🟡 **HUMAN BUSINESS DECISION / COMPATIBLE:** Final MTO advance is a negotiable, order-specific value
- 🟡 **HUMAN BUSINESS DECISION / COMPATIBLE:** Default MTO lead time is 15 days (configurable)
- 🟡 **HUMAN BUSINESS DECISION / COMPATIBLE:** Production confirmation is blocked until the required advance is received
- 🟠 **ARCHITECTURAL DETAIL REQUIRED:** Exactly how the Prisma schema preserves a lossless canonical MTO representation

---

## 3. Canonical MTO Representation
- **FACT:** Sanity holds the authoritative MTO state (`availability`, `leadTimeDays`), but `sync.service.ts` loses this information by squashing it into Prisma's boolean `inStock` field.
- **INFERENCE:** Phase 6 must establish a canonical, lossless MTO representation across the pipeline (Sanity → Sync → Prisma/domain → Product UI → Cart → Checkout → OrderItem → Production).
- **RECOMMENDATION:** Evaluate whether **Option A** (`isMto Boolean`, `leadTimeDays Int`) or **Option B** (a richer availability/domain state enum mirroring Sanity) is the appropriate canonical representation.
- **DECISION REQUIRED:** **REQUIRES SPECIFICATION DECISION** (Determine the exact canonical Prisma representation).

---

## 4. Order Snapshot
- **FACT:** `OrderItem` currently only snapshots `productId, productName, quantity, unitPrice`.
- **INFERENCE:** If a product changes from MTO to Available (e.g., standard inventory is produced), historical orders must not suddenly lose their MTO context.
- **RECOMMENDATION:** An MTO OrderItem must preserve historical MTO information (at minimum evaluating `isMto` and `leadTimeDays`).
- **DECISION REQUIRED:** **REQUIRES SPECIFICATION DECISION** (Determine the exact OrderItem snapshot fields).

---

## 5. Cart / Checkout (Phase 6 vs Phase 7 Boundary)
- **AUTHORITATIVE BOUNDARY:**
  - **PHASE 6 (MTO):** Standard catalog product + predefined product configuration + catalog price + known manufacturing lead time + standard checkout/order flow + production workflow.
  - **PHASE 7 (Custom Order):** Bespoke dimensions, custom design, custom wood/specification, non-standard configuration, quotation/manual pricing, customer-specific requirements.
- **DECISION:** MTO products must flow through the standard Cart and Checkout flow. Custom Order functionality (e.g., `<InquiryDialog>`) MUST NOT be implemented in Phase 6. The architecture must preserve a clean boundary for Phase 7 to integrate later.

---

## 6. Mixed Cart
- **AUTHORITATIVE BUSINESS DECISION:** Available and MTO items may coexist in the customer's cart, but the checkout flow must produce **SEPARATE ORDERS**. 
- **REASON:** Available products can be fulfilled within a short timeframe, while MTO products require substantially longer manufacturing time. Therefore, Available items → Available Order, MTO items → MTO Order. They must not be merged into a single order.
- **DECISION REQUIRED:** **REQUIRES SPECIFICATION DECISION** (Determine the exact mixed-order creation transaction behavior).

---

## 7. MTO Lead Time & Quantity
- **AUTHORITATIVE BUSINESS DECISION:** The default MTO manufacturing lead time is **15 DAYS**. This is a configurable product-level value (e.g., `leadTimeDays`) and must NOT be hard-coded.
- **QUANTITY IMPACT:** Do NOT invent a quantity multiplication formula (e.g., 15 × quantity). `leadTimeDays` is treated as the configured estimated manufacturing duration for the MTO order, regardless of quantity, unless future business evidence establishes otherwise.

---

## 8. Lead-Time Semantics
- **AUTHORITATIVE BUSINESS DECISION:** `leadTimeDays` means **CUSTOMER-FACING ESTIMATED MANUFACTURING TIME**.
- **RESTRICTIONS:** It does NOT include shipping time, courier transit, or final-mile delivery. It must not be presented as a guaranteed delivery date, nor automatically calculated into a shipping ETA.

---

## 9. MTO Advance Policy & Snapshot
- **AUTHORITATIVE BUSINESS DECISION:** The default MTO advance is **30% OF THE MTO ORDER TOTAL**.
- **FINANCIAL AUTHORITY:** 30% is a default, not a universal rule. The final agreed advance is an order-specific value determined through authorized business agreement (e.g., 20%, 30%, 40%). Customers cannot edit this directly.
- **ADVANCE SNAPSHOT:** Once agreed, the order must retain that requirement as historical truth. Later changes to the global 30% default MUST NOT alter existing orders.
- **DECISION REQUIRED:** **REQUIRES SPECIFICATION DECISION** (Determine the exact Order-level financial/advance snapshot fields without modifying existing PaymentService contracts).

---

## 10. Production State Machine & Confirmation
- **AUTHORITATIVE BUSINESS DECISION:** Production MUST NOT be confirmed/started until the final required advance has been received. 
- **FLOW:** 
  1. MTO Order Created
  2. Final Required Advance determined
  3. Advance < Required Advance → Production Confirmation BLOCKED
  4. Advance >= Required Advance → Production Confirmation ELIGIBLE
  5. Authorized Admin confirms production
  6. `productionState` → `IN_PROGRESS`
- **RESTRICTION:** Receiving the advance does not auto-start production. An authorized Admin/workshop operator must manually confirm production.
- **DECISION REQUIRED:** **REQUIRES SPECIFICATION DECISION** (Determine the exact `ProductionState` transition matrix and Admin UI contract).

---

## 11. Tracking State vs Production State
- **AUTHORITATIVE DECISION:** Phase 6 must strictly decouple `TrackingState` from `ProductionState`. They must not be merged.
- **DECISION REQUIRED:** **REQUIRES SPECIFICATION DECISION** (Define the responsibility of each state, valid transitions, invalid/contradictory combinations, and which states are customer-facing vs workshop-facing).

---

## 12. Order Events
- **RECOMMENDATION:** Production transitions (e.g., `NOT_STARTED` → `IN_PROGRESS`) should generate an `OrderEvent` for history and future Phase 9 communication.
- **DECISION REQUIRED:** **REQUIRES SPECIFICATION DECISION** (Exact OrderEvent requirements).

---

## 13. Admin Authorization
- **RECOMMENDATION:** Existing `ADMIN` role is sufficient for confirming production. Do NOT invent a new role.

---

## 14. Payment Contract
- **AUTHORITATIVE DECISION:** The Phase 5 Payment architecture remains completely frozen. 
- **RESTRICTIONS:** `PaymentService`, `PaymentRecord`, `PaymentReferenceClaim`, and Idempotency are UNCHANGED. MTO must integrate with this existing architecture.

---

## 15. Sanity Sync Contract
- **RECOMMENDATION:** The sync engine must be updated so that Sanity's `Made-to-Order` and `leadTimeDays` remain distinguishable through synchronization into the Prisma domain.

---

## 16. Test Infrastructure
- **AUTHORITATIVE FACT:** Repository evidence (`package.json`) confirms the test framework is **Vitest**. Do not introduce a second framework. All Phase 6 tests must be written in Vitest.

---

## 17. Phase Boundaries
- **PHASE 6:** Strictly MTO catalog → cart → checkout → order → production workflow.
- **PHASE 7:** Custom request / quotation / bespoke.
- **PHASE 8:** Broader admin order management.
- **PHASE 9:** Documents / communication (no emails in Phase 6).
- **PHASE 11:** Shipping / delivery integration.

---

## 18. Decisions Requiring Specification Resolution
The following architectural details genuinely remain unresolved and must be decided during the Specification writing phase:
1. Exact canonical Prisma representation for MTO (Option A vs Option B).
2. Exact `OrderItem` financial/advance and MTO snapshot fields.
3. Exact `ProductionState` / `TrackingState` transition matrix and invariants.
4. Exact `OrderEvent` requirements for MTO transitions.
5. Exact mixed-order creation transaction behavior (how the Cart splits the checkout payload).
6. Exact Admin UI/state transition contract for confirming production once eligible.
