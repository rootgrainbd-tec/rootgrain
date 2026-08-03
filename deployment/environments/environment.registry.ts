import { EnvironmentPolicy } from './environment.policy';

export interface EnvironmentRegistryEntry {
  readonly environment_id: string;
  readonly environment_type: 'LOCAL' | 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION';
  readonly configuration_profile: string;
  readonly deployment_policy: EnvironmentPolicy;
  readonly promotion_rules: Readonly<Record<string, any>>;
}

export class EnvironmentRegistry {
  private static environments = new Map<string, EnvironmentRegistryEntry>();

  static register(entry: EnvironmentRegistryEntry): void {
     this.environments.set(entry.environment_id, entry);
  }

  static get(environment_id: string): EnvironmentRegistryEntry {
     const entry = this.environments.get(environment_id);
     if (!entry) throw new Error(`Environment ${environment_id} not found`);
     return entry;
  }
}
