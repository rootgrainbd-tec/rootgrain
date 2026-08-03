export interface VersionManifest {
  readonly semantic_version: string;
  readonly git_commit: string;
  readonly build_number: string;
}
