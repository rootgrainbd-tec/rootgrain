import { FinalRelease } from './final.release';
import { ProductionException } from '../exceptions/production.exception';

export class ReleaseValidator {
  static validate(release: FinalRelease): void {
     if (release.approval_status === 'REJECTED') {
         throw ProductionException.failClosed("Final release validation failed: Release is rejected.");
     }
     if (release.approval_status === 'PENDING') {
         throw ProductionException.validation("Final release validation failed: Release is pending approval.");
     }
     if (release.validation_status !== 'VALIDATED') {
         throw ProductionException.validation("Final release validation failed: Release must be in VALIDATED status.");
     }
  }
}
