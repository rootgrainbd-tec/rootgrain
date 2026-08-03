import { CommunicationException } from '../exceptions/communication.exception';

export class TemplateValidator {
  static validatePayload(payload: any, requiredVariables: string[]): void {
    if (!payload || typeof payload !== 'object') {
      throw CommunicationException.template('Payload must be an object');
    }
    const missing = requiredVariables.filter(v => !(v in payload));
    if (missing.length > 0) {
      throw CommunicationException.template('Payload is missing required template variables', { missing });
    }
  }
}
