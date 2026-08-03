export const JOURNAL_ENTRY_TYPES = {
  DEBIT: 'debit',
  CREDIT: 'credit',
} as const;

export const VALID_JOURNAL_ENTRY_TYPES = Object.values(JOURNAL_ENTRY_TYPES);
