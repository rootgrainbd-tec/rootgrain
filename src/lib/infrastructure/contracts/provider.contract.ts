export enum ProviderCategory {
  PERSISTENCE = 'PERSISTENCE',
  QUEUE = 'QUEUE',
  NOTIFICATION = 'NOTIFICATION',
  EVENTS = 'EVENTS',
  SCHEDULER = 'SCHEDULER',
  OBSERVABILITY = 'OBSERVABILITY'
}

export interface ProviderContract {
  readonly id: string;
  readonly category: ProviderCategory;
  readonly metadata: Readonly<Record<string, any>>;
}
