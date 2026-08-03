export interface WorkerContract {
  start(): Promise<void>;
  stop(): Promise<void>;
  process(taskId: string, payload: any): Promise<void>;
}
