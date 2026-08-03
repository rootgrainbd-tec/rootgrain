import { TemplateContract } from '../contracts/template.contract';

export const InvoiceGeneratedTemplate: TemplateContract = {
  template_id: 'INVOICE_GENERATED_V1',
  subject: 'Invoice {invoiceId} is ready',
  body_schema: {},
  required_variables: ['invoiceId', 'amountDue', 'dueDate'],
  version: '1.0.0'
};
