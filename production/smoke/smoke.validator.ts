import { SmokeTest } from './smoke.test';
import { ProductionException } from '../exceptions/production.exception';

export class SmokeValidator {
  static validate(tests: ReadonlyArray<SmokeTest>): void {
     for (const test of tests) {
        if (test.status === 'FAILED' || test.status === 'BLOCKED') {
            throw ProductionException.failClosed(`Smoke Test Validation Failed: Test ${test.smoke_id} resulted in ${test.status}`);
        }
        if (test.status === 'PENDING') {
            throw ProductionException.validation(`Smoke Test Validation Failed: Test ${test.smoke_id} is still pending.`);
        }
     }
  }
}
