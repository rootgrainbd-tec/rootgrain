// Separate from task.validator.ts in Phase 6.0, this handles the infrastructure wrapping
import { TaskException } from '../exceptions/task.exception';

export class TaskConfigValidator {
  static validate(type: string, payload: any): void {
     if (!type) throw TaskException.validation('Task type is required');
     if (!payload) throw TaskException.validation('Task payload is required');
  }
}
