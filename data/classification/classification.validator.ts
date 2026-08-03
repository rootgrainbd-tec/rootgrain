import { ClassificationContract } from './classification.contract';
import { DataException } from '../exceptions/data.exception';

export class ClassificationValidator {
  static validate(contract: ClassificationContract): void {
     if (!contract.data_id || !contract.classification_level) {
        throw DataException.validation("Classification contract missing required properties");
     }
  }
}
