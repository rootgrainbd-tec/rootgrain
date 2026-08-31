-- Phase 8 Slice 2: Add VOIDED to PaymentStatus enum
-- Safe forward-only enum value addition (no table rewrite, no data loss)
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'VOIDED';
