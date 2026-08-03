export interface RuntimeManifest {
  readonly node_version: string;
  readonly memory_limit_mb: number;
  readonly cpu_limit_cores: number;
  readonly instance_id: string;
}
