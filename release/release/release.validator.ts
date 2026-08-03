import { ReleaseCandidate } from './release.candidate';

export class ReleaseValidator {
  static validate(candidate: ReleaseCandidate): void {
     if (candidate.approval_status === 'REJECTED') {
         throw new Error("Release Validation Failed: Candidate is rejected and cannot proceed.");
     }
     if (!candidate.release_id || !candidate.version || !candidate.commit_reference) {
         throw new Error("Release Validation Failed: Missing core identifiers.");
     }
  }
}
