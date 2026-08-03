import { ExperimentContract } from './experiment.contract';
import { GrowthMetric } from './growth.metric';
import { ProductException } from '../exceptions/product.exception';

export class GrowthValidator {
  static validate(experiment: ExperimentContract, metric: GrowthMetric): void {
      if (!experiment.hypothesis || !experiment.success_metric) {
          throw ProductException.failClosed("Growth Validation Failed: Hypothesis and success metric are strictly required.");
      }
      if (experiment.evaluation_status === 'SUCCESSFUL' && !metric.statistical_significance) {
          throw ProductException.failClosed("Growth Validation Failed: Successful experiment lacks statistical significance.");
      }
  }
}
