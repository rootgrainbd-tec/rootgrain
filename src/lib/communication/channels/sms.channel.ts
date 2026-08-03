import { ChannelContract } from '../contracts/channel.contract';
import { NotificationContract, CommunicationChannel } from '../contracts/notification.contract';

export class SmsChannel implements ChannelContract {
  readonly channelType = CommunicationChannel.SMS;

  async send(notification: NotificationContract): Promise<void> {
     // Stub: external infrastructure omitted
  }

  validateRecipient(recipient: string): boolean {
    // Basic SMS stub validation
    return /^\+?[1-9]\d{1,14}$/.test(recipient);
  }
}
