export interface ArtifactManifest {
  readonly artifact_id: string;
  readonly version: string;
  readonly checksum: string;
  readonly packaged_at: number;
}
