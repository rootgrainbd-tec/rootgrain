import { ArtifactManifest } from '../manifests/artifact.manifest';

export class PackageValidator {
  static validate(manifest: ArtifactManifest): void {
     if (!manifest.artifact_id || !manifest.version || !manifest.checksum) {
        throw new Error("Artifact manifest is missing required properties for deterministic packaging");
     }
  }
}
