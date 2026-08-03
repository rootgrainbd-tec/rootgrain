import { ProductionReadiness } from './production.readiness';

export class ReadinessValidator {
  static validate(readiness: ProductionReadiness): void {
     const isReady = (
         readiness.application_health === 'PASS' &&
         readiness.security_readiness === 'PASS' &&
         readiness.backup_readiness === 'PASS' &&
         readiness.monitoring_readiness === 'PASS' &&
         readiness.configuration_readiness === 'PASS' &&
         readiness.release_readiness === 'PASS'
     );

     if (!isReady) {
        throw new Error("Production Readiness Failed: One or more critical checks did not pass.");
     }
  }
}
