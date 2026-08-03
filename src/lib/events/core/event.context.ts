export enum EventState {
  CREATED = 'CREATED',
  VALIDATED = 'VALIDATED',
  DISPATCHED = 'DISPATCHED',
  HANDLED = 'HANDLED',
  FAILED = 'FAILED'
}

export interface EventContext {
  readonly eventId: string;
  readonly state: EventState;
  readonly error?: string;
  readonly timestamp: number;
}
