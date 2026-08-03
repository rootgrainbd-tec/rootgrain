import { PolicyContract } from '../governance/policy.contract';
import { ControlContract } from '../governance/control.contract';
import { SecurityException } from '../exceptions/security.exception';

export class SecurityRegistry {
  private static policies = new Map<string, PolicyContract>();
  private static controls = new Map<string, ControlContract>();

  static registerPolicy(policy: PolicyContract): void {
     if (this.policies.has(policy.policy_id)) {
        throw SecurityException.validation(`Policy ID ${policy.policy_id} already registered`);
     }
     this.policies.set(policy.policy_id, policy);
  }

  static getPolicy(id: string): PolicyContract {
     const policy = this.policies.get(id);
     if (!policy) throw SecurityException.validation(`Policy ${id} not found`);
     return policy;
  }

  static registerControl(control: ControlContract): void {
     if (this.controls.has(control.control_id)) {
        throw SecurityException.validation(`Control ID ${control.control_id} already registered`);
     }
     this.controls.set(control.control_id, control);
  }

  static getControl(id: string): ControlContract {
     const control = this.controls.get(id);
     if (!control) throw SecurityException.validation(`Control ${id} not found`);
     return control;
  }
}
