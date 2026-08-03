export interface ArtifactContract {
  readonly artifact_id: string;
  readonly checksum: string;
  readonly size_bytes: number;
  readonly storage_uri: string;
}
