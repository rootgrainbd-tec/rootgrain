import { ResourceProfile } from './resource.profile';
import { StartupProfile } from './startup.profile';
import { ShutdownProfile } from './shutdown.profile';

export interface RuntimeProfile {
  readonly profile_id: string;
  readonly resource_profile: ResourceProfile;
  readonly startup_profile: StartupProfile;
  readonly shutdown_profile: ShutdownProfile;
}
