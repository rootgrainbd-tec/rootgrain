export interface TaskResultContract<T = any> {
  success: boolean;
  taskId: string;
  data?: Readonly<T>;
  error?: string;
  durationMs: number;
}
