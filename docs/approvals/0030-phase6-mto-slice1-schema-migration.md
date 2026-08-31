# 0030 Phase 6: MTO Slice 1 - Schema & Migration Approval

**Status:** AWAITING APPROVAL

## 1. Objective
Execute Phase 6 Slice 1: Implement the database schema changes required to support the MTO architecture (as explicitly detailed in `0029-phase6-mto-implementation-plan.md` Revision 3) and generate the corresponding Prisma migration.

## 2. Existing Architecture Findings
Based on the inspection of `prisma/schema.prisma`:
- **Product Model**: Currently lacks any native MTO fields.
- **Order Model**: Contains `notes` (which will be treated as the immutable Customer Note). Contains all financial fields (`requiredAdvance`, `advancePaid`, `balanceDue`) and state enums (`ProductionState`, `TrackingState`, `OrderStatus`).
- **Internal Notes**: No model currently exists for Admin-only operational notes.

## 3. Data Model Changes

**Model: Product**
Adding configuration fields for MTO identity and lead-time estimation.
```prisma
  isMto                      Boolean @default(false)
  baseLeadTimeDays           Int     @default(30)
  additionalUnitLeadTimeDays Int     @default(10)
```

**Model: Order**
Adding MTO order identity and operational snapshoting fields.
```prisma
  isMtoOrder                 Boolean @default(false)
  advanceDeadline            DateTime?
  estimatedManufacturingDays Int?
  internalNotes              AdminInternalNote[]
```
*(The existing `notes String?` field remains perfectly intact to serve as the immutable Customer Note.)*

**Model: AdminInternalNote (NEW)**
Adding a distinct model to support multiple, auditable admin operational notes hidden from customers.
```prisma
model AdminInternalNote {
  id        String   @id @default(cuid())
  orderId   String
  content   String
  createdBy String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  order     Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@index([orderId])
}
```

## 4. Files Expected to Change
- `prisma/schema.prisma`
- Generated Prisma client definitions.
- `prisma/migrations/*` (A new migration folder will be created upon `npx prisma migrate dev`).

## 5. Rollback Considerations
- These are purely additive changes (`@default` values provided for non-nullable boolean/int fields, others are optional).
- Reversibility: Dropping the `AdminInternalNote` table and removing the added columns from `Product` and `Order`.

## 6. Acceptance Criteria for Slice 1
- `prisma/schema.prisma` is successfully modified.
- `npx prisma format` passes.
- `npx prisma migrate dev --name phase6_mto_schema` completes successfully without data loss on existing records.
- Prisma Client successfully regenerates.

---
**STATUS:** AWAITING APPROVAL
**IMPLEMENTATION:** BLOCKED
