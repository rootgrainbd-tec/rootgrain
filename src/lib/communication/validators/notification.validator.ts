import { CommunicationException } from '../exceptions/communication.exception';

export class NotificationValidator {
  static validate(notification: any): void {
    if (!notification || typeof notification !== 'object') {
      throw CommunicationException.validation('Notification must be an object');
    }
    const required = ['id', 'type', 'recipient', 'channel', 'template', 'payload', 'metadata', 'created_at'];
    const missing = required.filter(f => !(f in notification));
    if (missing.length > 0) {
      throw CommunicationException.validation('Notification is missing required fields', { missing });
    }
    if (!Object.isFrozen(notification)) {
      throw CommunicationException.validation('Notification must be frozen');
    }
  }
}
