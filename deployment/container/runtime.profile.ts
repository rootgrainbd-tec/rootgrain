import { ResourceProfile } from '../runtime/resource.profile';
import { StartupProfile } from '../runtime/startup.profile';
import { ShutdownProfile } from '../runtime/shutdown.profile';

export interface RuntimeProfile {
  readonly profile_id: string;
  readonly resource_profile: ResourceProfile;
  readonly startup_profile: StartupProfile;
  readonly shutdown_profile: ShutdownProfile;
}
