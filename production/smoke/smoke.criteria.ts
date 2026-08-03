export interface SmokeCriteria {
  readonly criteria_id: string;
  readonly test_cases: ReadonlyArray<string>;
  readonly threshold: number; // e.g., 100 for 100% pass required
}
