import { RuntimeProfile } from '../container/runtime.profile';

export interface ContainerContract {
  readonly image_id: string;
  readonly image_version: string;
  readonly runtime_profile: RuntimeProfile;
  readonly base_image: string;
  readonly build_metadata: Readonly<Record<string, string>>;
}
