import { OptimizationContract } from '../contracts/optimization.contract';
import { PerformanceException } from '../exceptions/performance.exception';

export class OptimizationValidator {
  static validate(contract: OptimizationContract): void {
     if (contract.expected_improvement <= 0) {
        throw PerformanceException.failClosed("Optimization expected improvement must be strictly positive");
     }
  }
}
