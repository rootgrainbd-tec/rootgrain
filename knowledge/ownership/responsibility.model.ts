export interface ResponsibilityModel {
  readonly model_id: string;
  readonly scope: string;
  readonly accountabilities: ReadonlyArray<string>;
}
