export enum LifecycleState {
  REGISTERED = 'REGISTERED',
  INITIALIZED = 'INITIALIZED',
  READY = 'READY',
  DEGRADED = 'DEGRADED',
  STOPPED = 'STOPPED',
  FAILED = 'FAILED'
}

export interface LifecycleContract {
  initialize(): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
}
