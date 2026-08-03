import { HealthContract, HealthStatus } from '../contracts/health.contract';
import { InfrastructureException } from '../exceptions/infrastructure.exception';

export class HealthCheck {
  static async evaluate(healthContract: HealthContract): Promise<HealthStatus> {
     try {
       const status = await healthContract.checkHealth();
       if (!Object.values(HealthStatus).includes(status)) {
          throw InfrastructureException.health('Provider returned an invalid health status', { status });
       }
       return status;
     } catch (e: any) {
       return HealthStatus.UNHEALTHY;
     }
  }
}
