import { MonitoringContext } from './monitoring.context';
import { HealthSignal } from './health.signal';

export interface MonitoringContract {
  readonly context: MonitoringContext;
  readonly signals: ReadonlyArray<HealthSignal>;
}
