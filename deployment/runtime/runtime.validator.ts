import { RuntimeProfile } from '../container/runtime.profile';

export class RuntimeValidator {
  static validate(profile: RuntimeProfile): void {
     if (!profile.profile_id) throw new Error("Runtime profile missing ID");
     if (profile.resource_profile.cpu_cores_max < profile.resource_profile.cpu_cores_min) {
        throw new Error("Max CPU cannot be less than Min CPU");
     }
     if (profile.resource_profile.memory_mb_max < profile.resource_profile.memory_mb_min) {
        throw new Error("Max Memory cannot be less than Min Memory");
     }
  }
}
