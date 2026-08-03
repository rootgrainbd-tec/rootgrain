export interface PromotionContract {
  readonly source_environment: string;
  readonly target_environment: string;
  readonly release_id: string;
  readonly artifact_version: string;
  readonly approval_state: 'PENDING' | 'APPROVED' | 'REJECTED';
}
