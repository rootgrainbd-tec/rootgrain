import { ContainerManifest } from '../manifests/container.manifest';

export class PackageLifecycle {
  static execute(manifest: ContainerManifest): ContainerManifest {
     return { ...manifest, state: 'PACKAGED' };
  }
}
