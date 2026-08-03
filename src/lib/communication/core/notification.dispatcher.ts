import { NotificationContract } from '../contracts/notification.contract';
import { CommunicationRegistry } from '../registry/communication.registry';
import { CommunicationException } from '../exceptions/communication.exception';

export class NotificationDispatcher {
  static async queueForDelivery(notification: NotificationContract): Promise<void> {
    const channel = CommunicationRegistry.getChannel(notification.channel);
    
    if (!channel.validateRecipient(notification.recipient)) {
       throw CommunicationException.channel('Invalid recipient format for channel', { channel: notification.channel, recipient: notification.recipient });
    }

    try {
      // In Phase 6.3 this is an abstraction boundary. We pretend to queue/send it.
      await channel.send(notification);
    } catch (e: any) {
      throw CommunicationException.delivery(`Channel delivery failed: ${e.message}`, { notificationId: notification.id });
    }
  }
}
