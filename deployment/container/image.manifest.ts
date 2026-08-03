export interface ImageManifest {
  readonly image_id: string;
  readonly image_version: string;
  readonly checksum: string;
  readonly build_timestamp: number;
}
