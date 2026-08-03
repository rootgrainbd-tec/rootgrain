import { TemplateContract } from '../contracts/template.contract';

export const ProductionAlertTemplate: TemplateContract = {
  template_id: 'PRODUCTION_ALERT_V1',
  subject: 'Production Alert: {productionId}',
  body_schema: {},
  required_variables: ['productionId', 'alertMessage'],
  version: '1.0.0'
};
