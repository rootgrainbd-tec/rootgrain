import { IncidentContract, IncidentState } from './incident.contract';

export class IncidentLifecycle {
  static transition(incident: IncidentContract, newState: IncidentState): IncidentContract {
     return { ...incident, state: newState };
  }
}
