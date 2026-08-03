import { ContainerManifest } from '../manifests/container.manifest';

export class PublishLifecycle {
  static execute(manifest: ContainerManifest): ContainerManifest {
     return { ...manifest, state: 'PUBLISHED' };
  }
}
