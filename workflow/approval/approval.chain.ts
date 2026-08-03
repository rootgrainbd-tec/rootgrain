import { ApprovalContract, ApprovalStatus } from '../contracts/approval.contract';

export interface ApprovalChain extends ApprovalContract {
  readonly approvers: ReadonlyArray<string>;
  readonly approval_order: 'SEQUENTIAL' | 'PARALLEL';
  readonly approval_policy: string;
}
