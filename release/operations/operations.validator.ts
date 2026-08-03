import { LaunchChecklist } from './launch.checklist';

export class OperationsValidator {
  static validate(checklist: LaunchChecklist): void {
     const isReady = (
         checklist.support_readiness === 'PASS' &&
         checklist.incident_response_readiness === 'PASS' &&
         checklist.documentation_availability === 'PASS' &&
         checklist.ownership_assignment === 'PASS' &&
         checklist.recovery_readiness === 'PASS'
     );

     if (!isReady) {
         throw new Error("Operational Validation Failed: Go-Live operational checks did not pass.");
     }
  }
}
