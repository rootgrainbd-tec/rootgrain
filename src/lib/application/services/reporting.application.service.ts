import { UseCaseContract } from '../contracts/usecase.contract';
import { ApplicationValidator } from '../validators/application.validator';
import { ApplicationException } from '../exceptions/application.exception';

export class ReportingApplicationService implements UseCaseContract<any, any> {
  async execute(input: any): Promise<any> {
    ApplicationValidator.validateInput(input, ['action']);
    
    try {
      return { status: 'REPORTING_PROCESSED', input };
    } catch (e: any) {
      throw ApplicationException.workflow('Reporting use-case failed', { reason: e.message });
    }
  }
}
