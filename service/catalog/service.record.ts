export interface ServiceRecord {
  readonly service_id: string;
  readonly description: string;
  readonly ownership: string;
  readonly dependencies: ReadonlyArray<string>;
  readonly availability_target: string;
}
