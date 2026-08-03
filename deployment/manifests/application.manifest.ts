export interface ApplicationManifest {
  readonly app_name: string;
  readonly components: ReadonlyArray<string>;
  readonly requires_infrastructure: ReadonlyArray<string>;
}
