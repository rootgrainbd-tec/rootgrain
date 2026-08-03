import { ContainerManifest } from '../manifests/container.manifest';
import { BuildLifecycle } from './build.lifecycle';
import { PackageLifecycle } from './package.lifecycle';
import { PublishLifecycle } from './publish.lifecycle';

export class ImageLifecycle {
  static async executeFullPipeline(manifest: ContainerManifest): Promise<ContainerManifest> {
      let state = BuildLifecycle.execute(manifest);
      state = { ...state, state: 'VALIDATED' }; // Mock validation step
      state = PackageLifecycle.execute(state);
      state = PublishLifecycle.execute(state);
      return state;
  }
}
