import { ContainerManifest } from '../manifests/container.manifest';

export class BuildLifecycle {
  static execute(manifest: ContainerManifest): ContainerManifest {
     return { ...manifest, state: 'BUILT' };
  }
}
