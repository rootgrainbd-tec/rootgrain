import { InfrastructureException } from '../exceptions/infrastructure.exception';

export class InfrastructureValidator {
  static validate(component: any): void {
     if (!component || typeof component !== 'object') {
       throw InfrastructureException.validation('Component must be a valid object');
     }
  }
}
