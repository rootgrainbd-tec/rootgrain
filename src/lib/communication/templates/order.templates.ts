import { TemplateContract } from '../contracts/template.contract';

export const OrderCreatedTemplate: TemplateContract = {
  template_id: 'ORDER_CREATED_V1',
  subject: 'Your Order {orderId} has been created',
  body_schema: {},
  required_variables: ['orderId', 'customerName', 'totalAmount'],
  version: '1.0.0'
};
