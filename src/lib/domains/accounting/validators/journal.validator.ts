import { JournalEntry } from '../types/journal-entry';
import { VALID_JOURNAL_ENTRY_TYPES } from '../constants/journal.constants';
import { JournalException } from '../exceptions/journal.exception';

export class JournalValidator {
  static validateEntry(entry: Partial<JournalEntry>): JournalEntry {
    const errors: Record<string, string[]> = {};

    if (!entry.id || typeof entry.id !== 'string') errors['id'] = ['Required'];
    if (!entry.reference_id || typeof entry.reference_id !== 'string') errors['reference_id'] = ['Required'];
    if (!entry.description || typeof entry.description !== 'string') errors['description'] = ['Required'];

    if (!entry.type || !VALID_JOURNAL_ENTRY_TYPES.includes(entry.type)) {
      errors['type'] = [`Must be a valid journal entry type: ${VALID_JOURNAL_ENTRY_TYPES.join(', ')}`];
    }

    if (typeof entry.debit !== 'number' || entry.debit < 0) {
      errors['debit'] = ['Must be a non-negative number'];
    }
    
    if (typeof entry.credit !== 'number' || entry.credit < 0) {
      errors['credit'] = ['Must be a non-negative number'];
    }
    
    if (typeof entry.balance !== 'number') {
      errors['balance'] = ['Required and must be a number'];
    }

    // A single entry must be strictly either debit OR credit (one is >0, the other is 0, or both 0 in weird edge cases but not both >0)
    if (entry.debit && entry.credit && entry.debit > 0 && entry.credit > 0) {
      errors['integrity'] = ['A single journal entry cannot have both debit and credit greater than zero'];
    }

    if (!(entry.created_at instanceof Date)) {
      errors['created_at'] = ['Required and must be a valid Date object'];
    }

    if (Object.keys(errors).length > 0) {
      throw new JournalException('Invalid journal entry data', errors);
    }

    return Object.freeze({ ...entry }) as JournalEntry;
  }
}
