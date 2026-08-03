import { FinalRelease } from '../release/final.release';
import { DeploymentExecution } from '../deployment/deployment.execution';
import { ProductionException } from '../exceptions/production.exception';

export class ProductionRegistry {
  private static releases = new Map<string, FinalRelease>();
  private static deployments = new Map<string, DeploymentExecution>();

  static registerRelease(release: FinalRelease): void {
     if (this.releases.has(release.release_id)) throw ProductionException.validation("Duplicate Release ID in Production Registry");
     this.releases.set(release.release_id, release);
  }

  static registerDeployment(execution: DeploymentExecution): void {
     if (this.deployments.has(execution.execution_id)) throw ProductionException.validation("Duplicate Deployment ID in Production Registry");
     this.deployments.set(execution.execution_id, execution);
  }
}
