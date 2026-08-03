import { RuntimeProfile } from '../container/runtime.profile';
import { RuntimeValidator } from '../runtime/runtime.validator';

export class RuntimePackager {
  static packageProfile(profile: RuntimeProfile): RuntimeProfile {
     RuntimeValidator.validate(profile);
     return profile; // In a real system, this might serialize or bundle the profile
  }
}
