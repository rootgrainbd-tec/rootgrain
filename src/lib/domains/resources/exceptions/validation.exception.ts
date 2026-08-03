import { ResourceException } from './resource.exception';

export class ValidationException extends ResourceException {
  constructor(message: string, public readonly errors: Record<string, string[]>) {
    super(message, 'VALIDATION_FAILED');
    this.name = 'ValidationException';
  }
}
