import { RuntimeManifest } from '../manifests/runtime.manifest';

export class RuntimeLoader {
  static load(): RuntimeManifest {
    return {
       node_version: 'v20',
       memory_limit_mb: 1024,
       cpu_limit_cores: 1,
       instance_id: 'local-1'
    };
  }
}
