import { NotificationContract, CommunicationChannel } from '../contracts/notification.contract';
import { CommunicationContext, CommunicationState } from './communication.context';
import { DeliveryLifecycle } from './delivery.lifecycle';
import { NotificationValidator } from '../validators/notification.validator';
import { TemplateValidator } from '../validators/template.validator';
import { CommunicationRegistry } from '../registry/communication.registry';
import { CommunicationException } from '../exceptions/communication.exception';
import { NotificationDispatcher } from './notification.dispatcher';

export class NotificationService {
  async dispatch(notification: NotificationContract): Promise<void> {
    let context: CommunicationContext = { notificationId: notification.id, state: CommunicationState.CREATED, timestamp: Date.now() };

    try {
      // Validate structure
      NotificationValidator.validate(notification);
      
      // Validate Template bounds
      const template = CommunicationRegistry.getTemplate(notification.template);
      TemplateValidator.validatePayload(notification.payload, template.required_variables);

      context = DeliveryLifecycle.transition(context, CommunicationState.VALIDATED);
      
      await NotificationDispatcher.queueForDelivery(notification);
      context = DeliveryLifecycle.transition(context, CommunicationState.QUEUED);

    } catch (e: any) {
      context = DeliveryLifecycle.transition(context, CommunicationState.FAILED, e.message);
      throw CommunicationException.delivery(`Dispatch failed: ${e.message}`, { notificationId: notification.id, originalError: e.message });
    }
  }
}
