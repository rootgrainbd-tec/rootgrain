import { DisasterContract, MitigationStatus } from './disaster.contract';

export class DisasterWorkflow {
  static transition(scenario: DisasterContract, status: MitigationStatus): DisasterContract {
     return { ...scenario, mitigation_status: status };
  }
}
