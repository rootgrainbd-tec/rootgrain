export interface QueueContract {
  enqueue(taskType: string, payload: any, options?: any): Promise<string>;
  dequeue(queueName: string): Promise<any>;
  acknowledge(taskId: string): Promise<void>;
  fail(taskId: string, error: any): Promise<void>;
}
