import { JournalEntry } from '../types/journal-entry';
import { AccountingRepository } from '../contracts/accounting-repository';
import { JournalValidator } from '../validators/journal.validator';

export class JournalService {
  constructor(private readonly repository: AccountingRepository) {}

  async recordEntry(payload: Partial<JournalEntry>): Promise<JournalEntry> {
    const validated = JournalValidator.validateEntry({
      ...payload,
      created_at: payload.created_at || new Date()
    });
    
    return this.repository.saveJournalEntry(validated);
  }

  // Pure logic helper for double entry integrity
  static verifyDoubleEntry(entries: JournalEntry[]): boolean {
    const totalDebit = entries.reduce((sum, entry) => sum + entry.debit, 0);
    const totalCredit = entries.reduce((sum, entry) => sum + entry.credit, 0);
    
    // In double-entry bookkeeping, the sum of debits must equal the sum of credits for a transaction set.
    return Math.abs(totalDebit - totalCredit) < 0.01;
  }
}
