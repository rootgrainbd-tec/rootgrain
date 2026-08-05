import { IncidentContract } from '../incidents/incident.contract';

export class IncidentValidator {
  static validate(incident: IncidentContract): void {
     if (!incident.incident_id || !incident.severity || !incident.state) {
        throw new Error("Incident is missing required operational identifiers");
     }
  }
}
