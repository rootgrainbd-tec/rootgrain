export interface BenchmarkContract {
  readonly benchmark_id: string;
  readonly scenario: string;
  readonly workload_profile: string;
  readonly expected_result: string;
  readonly validation_status: 'VALIDATED' | 'UNVALIDATED' | 'FAILED';
}
