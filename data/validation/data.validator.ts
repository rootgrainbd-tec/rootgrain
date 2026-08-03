import { ClassificationContract } from '../classification/classification.contract';
import { DataException } from '../exceptions/data.exception';

export class DataValidator {
  static checkAccess(classification: ClassificationContract, userClearance: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED'): void {
     const hierarchy = { 'PUBLIC': 0, 'INTERNAL': 1, 'CONFIDENTIAL': 2, 'RESTRICTED': 3 };
     if (hierarchy[userClearance] < hierarchy[classification.classification_level]) {
        throw DataException.failClosed("Insufficient clearance for data classification");
     }
  }
}
