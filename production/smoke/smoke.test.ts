export type SmokeStatus = 'PENDING' | 'PASSED' | 'FAILED' | 'BLOCKED';

export interface SmokeTest {
  readonly smoke_id: string;
  readonly release_id: string;
  readonly scenario: string;
  readonly expected_result: string;
  readonly actual_result: string;
  readonly status: SmokeStatus;
}
