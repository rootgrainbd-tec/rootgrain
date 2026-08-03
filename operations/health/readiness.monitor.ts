import { HealthSignal, HealthStatus } from '../monitoring/health.signal';

export class ReadinessMonitor {
  static evaluate(signals: HealthSignal[]): HealthStatus {
     if (signals.some(s => s.status === 'UNHEALTHY')) return 'UNHEALTHY';
     if (signals.some(s => s.status === 'DEGRADED')) return 'DEGRADED';
     return 'HEALTHY';
  }
}
