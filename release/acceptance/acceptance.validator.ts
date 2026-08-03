import { UserAcceptance } from './user.acceptance';

export class AcceptanceValidator {
  static validate(acceptance: UserAcceptance): void {
      if (acceptance.status === 'FAILED' || acceptance.status === 'BLOCKED') {
          throw new Error(`Acceptance Validation Failed: Acceptance testing status is ${acceptance.status}`);
      }
      if (acceptance.status === 'PENDING') {
          throw new Error("Acceptance Validation Failed: Acceptance testing is still pending.");
      }
  }
}
