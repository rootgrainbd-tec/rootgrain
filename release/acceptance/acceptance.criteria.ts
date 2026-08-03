export interface AcceptanceCriteria {
  readonly criteria_id: string;
  readonly scope: string;
  readonly test_cases: ReadonlyArray<string>;
}
