export interface ReleaseContract {
  readonly release_id: string;
  readonly semantic_version: string;
  readonly deployment_target: string;
  readonly rollback_target: string;
  readonly metadata: Readonly<Record<string, any>>;
}
