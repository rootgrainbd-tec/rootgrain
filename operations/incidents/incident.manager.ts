import { IncidentContract } from './incident.contract';
import { IncidentLifecycle } from './incident.lifecycle';

export class IncidentManager {
  static declareIncident(incident: IncidentContract): IncidentContract {
     return IncidentLifecycle.transition(incident, 'CREATED');
  }
}
