import { HealthSignal, HealthStatus } from '../monitoring/health.signal';

export class AvailabilityMonitor {
  static evaluate(signal: HealthSignal): HealthStatus {
     return signal.status;
  }
}
