import { NotificationContract, CommunicationChannel } from './notification.contract';

export interface ChannelContract {
  readonly channelType: CommunicationChannel;
  send(notification: NotificationContract): Promise<void>;
  validateRecipient(recipient: string): boolean;
}
