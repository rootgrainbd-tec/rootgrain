import { HealthSignal, HealthStatus } from '../monitoring/health.signal';

export class DependencyMonitor {
  static evaluate(signal: HealthSignal): HealthStatus {
     return signal.status;
  }
}
