export class PersistenceException extends Error {
  constructor(message: string, public readonly code: string, public readonly entity?: string) {
    super(message);
    this.name = 'PersistenceException';
  }
}
