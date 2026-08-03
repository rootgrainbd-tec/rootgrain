import { AlertContract } from './alert.contract';

export class AlertRegistry {
  private static alerts = new Map<string, AlertContract>();

  static register(alert: AlertContract): void {
     this.alerts.set(alert.alert_id, alert);
  }

  static getActiveAlerts(): AlertContract[] {
     return Array.from(this.alerts.values()).filter(a => a.status === 'ACTIVE');
  }
}
