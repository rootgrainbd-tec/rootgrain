import { SupportWorkflow } from './support.workflow';
import { ServiceException } from '../exceptions/service.exception';

export class SupportValidator {
  static validate(workflow: SupportWorkflow): void {
     if (!workflow.workflow_id || !workflow.escalation_path) {
        throw ServiceException.validation("Support workflow missing critical routing paths");
     }
  }
}
