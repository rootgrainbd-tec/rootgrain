import { AccountingException } from './accounting.exception';

export class JournalException extends AccountingException {
  constructor(message: string, public readonly errors: Record<string, string[]>) {
    super(message, 'JOURNAL_OPERATION_FAILED');
    this.name = 'JournalException';
  }
}
