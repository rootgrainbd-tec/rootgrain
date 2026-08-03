import { RuntimeConfig } from './runtime.config';
import { EnvironmentConfig } from './environment.config';
import { SecretsConfig } from './secrets.config';

export class DeploymentValidator {
  static validate(runtime: RuntimeConfig, env: EnvironmentConfig, secrets: SecretsConfig): void {
     if (!runtime.application) throw new Error("Runtime config missing application name");
     if (!Object.isFrozen(env.variables)) throw new Error("Environment variables must be strictly immutable");
     if (!secrets.keys || secrets.keys.length === 0) throw new Error("Secrets definition invalid");
  }
}
