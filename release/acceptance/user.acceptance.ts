export type AcceptanceStatus = 'PENDING' | 'PASSED' | 'FAILED' | 'BLOCKED';

export interface UserAcceptance {
  readonly acceptance_id: string;
  readonly release_id: string;
  readonly scenario: string;
  readonly expected_result: string;
  readonly actual_result: string;
  readonly status: AcceptanceStatus;
}
