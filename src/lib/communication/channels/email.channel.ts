import { ChannelContract } from '../contracts/channel.contract';
import { NotificationContract, CommunicationChannel } from '../contracts/notification.contract';

export class EmailChannel implements ChannelContract {
  readonly channelType = CommunicationChannel.EMAIL;

  async send(notification: NotificationContract): Promise<void> {
     // Stub: external infrastructure omitted
  }

  validateRecipient(recipient: string): boolean {
    // Basic email stub validation
    return recipient.includes('@');
  }
}
