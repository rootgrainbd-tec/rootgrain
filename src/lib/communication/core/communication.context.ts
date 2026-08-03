export enum CommunicationState {
  CREATED = 'CREATED',
  VALIDATED = 'VALIDATED',
  QUEUED = 'QUEUED',
  SENT = 'SENT',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export interface CommunicationContext {
  readonly notificationId: string;
  readonly state: CommunicationState;
  readonly error?: string;
  readonly timestamp: number;
}
