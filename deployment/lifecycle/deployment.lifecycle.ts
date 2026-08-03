import { DeploymentManifest, DeploymentState } from '../manifests/deployment.manifest';

export class DeploymentLifecycle {
  static transition(manifest: DeploymentManifest, newState: DeploymentState): DeploymentManifest {
      // Stub
      return { ...manifest, deployment_state: newState };
  }
}
