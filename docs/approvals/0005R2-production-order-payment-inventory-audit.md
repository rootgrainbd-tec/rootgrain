# ROOTGRAIN — PRODUCTION ORDER & PAYMENT INVENTORY AUDIT

**Document:** docs/approvals/0005R2-production-order-payment-inventory-audit.md  
**Status:** PRODUCTION INVENTORY VERIFIED — LEGACY RISK LOW

## PART 1 — DATABASE CONNECTION
Verified connection to remote `aws-1-ap-southeast-2.pooler.supabase.com`.
The database type is confirmed as **Production / Remote database**.

## PART 2 — ORDER INVENTORY
| Metric | Count |
|---|---:|
| Total Orders | 9 |
| Orders with advancePaid > 0 | 2 |
| Orders with advancePaid = 0 | 7 |
| Orders with balanceDue > 0 | 9 |
| Orders with balanceDue = 0 | 0 |
| PROCESSING | 1 |
| CANCELLED | 4 |
| PENDING_ADVANCE | 4 |

## PART 3 — TEST ORDER DETECTION
| Classification | Count | Evidence |
|---|---:|---|
| TEST | 9 | Matched generic test strings in name/address, default numbers (1234567890/01700000000), internal domains/emails. |
| REAL CUSTOMER | 0 | No genuine external retail addresses or active external customer footprints found. |
| UNKNOWN | 0 | All orders matched strong test criteria. |

## PART 4 — REAL CUSTOMER DATA CHECK
**REAL CUSTOMER ORDERS FOUND:** NO

## PART 5 — PAYMENT RECORD INVENTORY
- **Total PaymentRecords:** 0
- **Orders with PaymentRecords:** 0
- **Total Payment Amount:** 0
- **Maximum Payment Amount:** 0
- There are absolutely no populated `PaymentRecord` tables in the production database.

## PART 6 — LEGACY ADVANCE INVENTORY
| Category | Count | Amount |
|---|---:|---:|
| advancePaid > 0 | 2 | ৳7,000 |
| advancePaid > 0 + PaymentRecord | 0 | ৳0 |
| advancePaid > 0 + NO PaymentRecord | 2 | ৳7,000 |

## PART 7 — BALANCE INVENTORY
- **Orders with balanceDue > 0:** 9
- **Orders with balanceDue = 0:** 0
- **Negative balanceDue count:** 0
- **Invariant `balanceDue = total - advancePaid`:** Checked across all orders with advances. All valid.

## PART 8 — PAYMENT CONSISTENCY CHECK
| Order | AdvancePaid | PaymentRecord Sum | BalanceDue | Result |
|---|---:|---:|---:|---|
| RG-20260814-905161 | 2000 | 0 | 18900 | MISMATCH (No PR) |
| RG-20260815-713513 | 5000 | 0 | 15900 | MISMATCH (No PR) |

*Note: The mismatch is strictly between the legacy `advancePaid` and the empty `PaymentRecord` table. The invariant `balanceDue = total - advancePaid` holds perfectly.*

## PART 9 — TEST ORDER IMPACT
The 9 test orders contain typical structural layouts including populated `advancePaid`, empty `PaymentRecords`, and various logical status states (CANCELLED, PENDING_ADVANCE, PROCESSING). These do not carry genuine financial consequences and can safely remain untouched for legacy display compatibility.

## PART 10 — MIGRATION IMPACT
- **Question 1:** Do we have genuine historical customer payment records? **NO**
- **Question 2:** Do we need a complex historical PaymentRecord migration? **NO**
- **Question 3:** Can existing test orders simply remain readable under the new architecture? **YES**
- **Question 4:** Do any existing real orders require special migration treatment? **NO**
- **Question 5:** Does `advancePaid` contain real historical financial information that cannot safely be discarded? **NO**

## PART 11 — LEGACY STRATEGY RECOMMENDATION
**OPTION A**
No meaningful historical data exists.
→ Keep migration minimal.
→ Preserve test orders only for compatibility.
→ New PaymentRecord architecture applies to new payments/orders.

## PART 12 — PRODUCTION SAFETY
- READ-ONLY query used: Verified.
- No database write executed: Verified.
- No migration executed: Verified.
- No schema change: Verified.
- No application change: Verified.
- No deployment: Verified.

## PART 13 — BACKUP STATUS
**BACKUP NOT VERIFIED**

## PART 14 — IMPACT ON 0005R1
1. **Legacy `advancePaid`:** 0005R1 retains it as a cache. We can safely do this without worrying about disrupting thousands of historical rows.
2. **Synthetic PaymentRecord concern:** 0005R1 forbade fabricating historical events. This is highly suitable because we have 0 real records to migrate anyway.
3. **Historical migration:** Unnecessary.
4. **Existing PaymentRecord data:** Zero rows, so schema changes to `PaymentRecord` (adding fields, making fields required) are perfectly safe to roll out via Prisma.
5. **Test order handling:** They simply remain in the database, acting as fallback compatibility tests for the new UI.
*No changes are required to 0005R1's assumptions.*

## PART 15 — FINAL VERDICT
`PRODUCTION INVENTORY VERIFIED — LEGACY RISK LOW`
