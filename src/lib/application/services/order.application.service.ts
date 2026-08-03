import { UseCaseContract } from '../contracts/usecase.contract';
import { ApplicationValidator } from '../validators/application.validator';
import { ApplicationException } from '../exceptions/application.exception';

export class OrderApplicationService implements UseCaseContract<any, any> {
  async execute(input: any): Promise<any> {
    ApplicationValidator.validateInput(input, ['action']);
    
    try {
      return { status: 'ORDER_PROCESSED', input };
    } catch (e: any) {
      throw ApplicationException.workflow('Order use-case failed', { reason: e.message });
    }
  }
}
