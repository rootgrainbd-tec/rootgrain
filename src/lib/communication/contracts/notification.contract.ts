export enum CommunicationChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  IN_APP = 'IN_APP'
}

export interface NotificationContract<T = any> {
  readonly id: string;
  readonly type: string;
  readonly recipient: string;
  readonly channel: CommunicationChannel;
  readonly template: string;
  readonly payload: Readonly<T>;
  readonly metadata: Readonly<Record<string, any>>;
  readonly created_at: number;
}
