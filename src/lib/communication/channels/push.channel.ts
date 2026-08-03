import { ChannelContract } from '../contracts/channel.contract';
import { NotificationContract, CommunicationChannel } from '../contracts/notification.contract';

export class PushChannel implements ChannelContract {
  readonly channelType = CommunicationChannel.PUSH;

  async send(notification: NotificationContract): Promise<void> {}

  validateRecipient(recipient: string): boolean {
    return typeof recipient === 'string' && recipient.length > 0;
  }
}

export class InAppChannel implements ChannelContract {
  readonly channelType = CommunicationChannel.IN_APP;

  async send(notification: NotificationContract): Promise<void> {}

  validateRecipient(recipient: string): boolean {
    return typeof recipient === 'string' && recipient.length > 0;
  }
}
