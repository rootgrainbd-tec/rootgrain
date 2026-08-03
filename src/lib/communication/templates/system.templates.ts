import { TemplateContract } from '../contracts/template.contract';

export const SystemErrorTemplate: TemplateContract = {
  template_id: 'SYSTEM_ERROR_V1',
  subject: 'System Alert: {errorType}',
  body_schema: {},
  required_variables: ['errorType', 'timestamp', 'details'],
  version: '1.0.0'
};
