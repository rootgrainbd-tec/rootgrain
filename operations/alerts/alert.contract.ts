export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';
export type AlertStatus = 'ACTIVE' | 'RESOLVED' | 'MUTED';

export interface AlertContract {
  readonly alert_id: string;
  readonly severity: AlertSeverity;
  readonly condition: string;
  readonly threshold: number;
  readonly status: AlertStatus;
}
