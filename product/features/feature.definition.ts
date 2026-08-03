export interface FeatureDefinition {
  readonly definition_id: string;
  readonly feature_id: string;
  readonly use_cases: ReadonlyArray<string>;
  readonly acceptance_criteria: ReadonlyArray<string>;
}
