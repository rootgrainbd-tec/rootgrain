import { JOURNAL_ENTRY_TYPES } from '../constants/journal.constants';

export type JournalEntryType = typeof JOURNAL_ENTRY_TYPES[keyof typeof JOURNAL_ENTRY_TYPES];

export interface JournalEntry {
  id: string;
  reference_id: string; // E.g., Invoice ID, Payment ID
  type: JournalEntryType;
  debit: number;
  credit: number;
  balance: number;
  description: string;
  created_at: Date;
}
