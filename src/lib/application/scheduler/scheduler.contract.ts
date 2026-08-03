export interface SchedulerContract {
  schedule(taskType: string, payload: any, executionTime: Date): Promise<string>;
  cancel(scheduleId: string): Promise<void>;
}
