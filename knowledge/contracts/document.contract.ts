export type ReviewStatus = 'DRAFT' | 'REVIEW_REQUIRED' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';

export interface DocumentContract {
  readonly document_id: string;
  readonly title: string;
  readonly document_type: string;
  readonly owner: string;
  readonly version: string;
  readonly review_status: ReviewStatus;
}
