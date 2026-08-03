import { ApprovalChain } from './approval.chain';
import { WorkflowException } from '../exceptions/workflow.exception';

export class ApprovalValidator {
  static validate(chain: ApprovalChain): void {
     if (!chain.approval_id || chain.approvers.length === 0) {
        throw WorkflowException.validation("Approval chain missing essential properties");
     }
  }
}
