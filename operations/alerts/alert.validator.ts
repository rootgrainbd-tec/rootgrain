import { AlertContract } from './alert.contract';

export class AlertValidator {
  static validate(alert: AlertContract): void {
     if (!alert.alert_id || !alert.severity || !alert.condition) {
        throw new Error("Alert is missing required properties");
     }
  }
}
