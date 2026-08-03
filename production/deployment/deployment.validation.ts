import { ProductionException } from '../exceptions/production.exception';

export interface DeploymentValidationState {
  readonly release_integrity: 'PASS' | 'FAIL';
  readonly environment_compatibility: 'PASS' | 'FAIL';
  readonly configuration_consistency: 'PASS' | 'FAIL';
  readonly deployment_readiness: 'PASS' | 'FAIL';
  readonly rollback_availability: 'PASS' | 'FAIL';
}

export class DeploymentValidation {
  static validate(state: DeploymentValidationState): void {
     const isReady = (
         state.release_integrity === 'PASS' &&
         state.environment_compatibility === 'PASS' &&
         state.configuration_consistency === 'PASS' &&
         state.deployment_readiness === 'PASS' &&
         state.rollback_availability === 'PASS'
     );

     if (!isReady) {
         throw ProductionException.failClosed("Deployment Validation Failed: Production pre-flight checks failed.");
     }
  }
}
