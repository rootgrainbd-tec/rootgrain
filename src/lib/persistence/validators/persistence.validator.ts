import { PersistenceException } from '../exceptions/persistence.exception';

export class PersistenceValidator {
  static validateId(id: unknown): void {
    if (!id || typeof id !== 'string') {
      throw new PersistenceException('Invalid entity ID format', 'INVALID_ID');
    }
  }

  static validateEntityPayload(payload: unknown, entityName: string): void {
    if (!payload || typeof payload !== 'object') {
      throw new PersistenceException(`Invalid payload for entity ${entityName}`, 'INVALID_PAYLOAD', entityName);
    }
  }
}
