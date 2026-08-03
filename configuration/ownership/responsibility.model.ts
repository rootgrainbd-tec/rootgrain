export interface ResponsibilityModel {
  readonly model_id: string;
  readonly owner_id: string;
  readonly capabilities: ReadonlyArray<string>;
}
