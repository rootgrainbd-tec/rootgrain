import { ChangeContract } from '../contracts/change.contract';
import { ConfigurationException } from '../exceptions/configuration.exception';

export class ChangeControlValidator {
  static evaluate(change: ChangeContract): void {
     if (change.approval_status === 'REJECTED') {
        throw ConfigurationException.failClosed("Rejected changes cannot be processed");
     }
  }
}
