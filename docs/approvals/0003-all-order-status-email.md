# 0003: ALL ORDER STATUS EMAIL APPROVAL

## Objective
Implement email notifications for all valid order status transitions in a secure, non-disruptive manner without altering existing email behavior for already supported statuses.

## Execution Summary
- Added email triggers for `PROCESSING`, `REJECTED`, and `CANCELLED`.
- **Note:** Initial `PENDING_ADVANCE` email is handled by `sendOrderConfirmationEmail()`.
- **Note:** `PENDING_ADVANCE` is NOT part of status-transition emails to prevent duplication.
- Status-transition emails are strictly: `CONFIRMED`, `PROCESSING`, `DISPATCHED`, `DELIVERED`, `REJECTED`, `CANCELLED`.
- Verified that existing email triggers for `CONFIRMED`, `DISPATCHED`, and `DELIVERED` are preserved unchanged.
- Ensured emails are ONLY sent when the `status` actually changes (prevents redundant emails).
- Maintained the fire-and-forget architecture with local exception swallowing so checkout/admin flows are not disrupted if Resend fails.
- Wrote full unit test matrix in `tests/status-email.test.ts` to guarantee no duplicated sends and confirm correct wording generation.

## Modified Files
1. `src/services/order.service.ts`
   - Added logic to explicitly check `const statusChanged = currentOrder.status !== status;`.
   - Expanded the `emailableStatuses` array (omitting `PENDING_ADVANCE`).
2. `src/lib/email.ts`
   - Added `if/else` branches in `sendOrderStatusUpdateEmail` to support the new statuses and set appropriate `heading` and `statusMessage`.
3. `tests/status-email.test.ts` (NEW)
   - Matrix testing for all 6 transition statuses to ensure correct fire-and-forget execution and no redundant triggers.

## Verification Check
- [x] TypeScript compilation passes (`npx tsc --noEmit`).
- [x] Vitest suite passes entirely (covering full matrix + duplicate protection + regression safety).
- [x] Code strictly adheres to root constraints (no modification to DB schema, PDF generation, checkout core logic).

## Request for Approval
Please review this implementation plan. I will wait for your explicit approval before committing and deploying.
