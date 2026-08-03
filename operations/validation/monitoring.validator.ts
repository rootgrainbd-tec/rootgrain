import { MonitoringContract } from '../monitoring/monitoring.contract';

export class MonitoringValidator {
  static validate(contract: MonitoringContract): void {
     if (!contract.context || !contract.context.monitoring_id) {
        throw new Error("Monitoring contract is missing required context identifiers");
     }
  }
}
