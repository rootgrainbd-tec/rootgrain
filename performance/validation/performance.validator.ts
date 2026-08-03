import { PerformanceContract } from '../contracts/performance.contract';
import { PerformanceException } from '../exceptions/performance.exception';

export class PerformanceValidator {
  static validate(contract: PerformanceContract): void {
     if (!contract.performance_id || !contract.target_system) {
        throw PerformanceException.validation("Performance contract invalid");
     }
  }
}
