import { HealthValidation } from './health.validation';
import { StabilityCheck } from './stability.check';
import { ProductionException } from '../exceptions/production.exception';

export class PostlaunchValidator {
  static validate(health: HealthValidation, stability: StabilityCheck): void {
     if (!health.metrics_healthy || !health.error_rates_normal) {
        throw ProductionException.failClosed("Post-Launch Validation Failed: System health is degraded.");
     }
     if (stability.active_incidents > 0) {
        throw ProductionException.failClosed("Post-Launch Validation Failed: Active incidents exist post-launch.");
     }
  }
}
