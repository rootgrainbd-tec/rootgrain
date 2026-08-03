import { ExecutionContext, TaskState } from './execution.context';
import { LifecycleManager } from './lifecycle.manager';
import { RetryPolicy } from '../policies/retry.policy';
import { TaskResultContract } from '../contracts/task-result.contract';
import { RetryContract } from '../contracts/retry.contract';
import { TaskException } from '../exceptions/task.exception';
// Task execution would be imported here

export class TaskEngine {
  static async execute(context: ExecutionContext, retryConfig?: RetryContract): Promise<TaskResultContract> {
    const startTime = Date.now();
    let currentContext = context;

    try {
      currentContext = LifecycleManager.transition(currentContext, TaskState.RUNNING);

      // Stub for actual task execution
      // const task = TaskRegistry.get(currentContext.taskType);
      // await task.execute(currentContext.payload);

      currentContext = LifecycleManager.transition(currentContext, TaskState.COMPLETED);
      
      return {
        success: true,
        taskId: currentContext.taskId,
        durationMs: Date.now() - startTime
      };
    } catch (e: any) {
      if (retryConfig && RetryPolicy.evaluate(retryConfig, currentContext.attempt, e)) {
        currentContext = LifecycleManager.transition(currentContext, TaskState.RETRYING);
        // Queue re-enqueuing would happen here via QueueContract
        return {
          success: false,
          taskId: currentContext.taskId,
          error: `Retrying: ${e.message}`,
          durationMs: Date.now() - startTime
        };
      }

      currentContext = LifecycleManager.transition(currentContext, TaskState.FAILED);
      return {
        success: false,
        taskId: currentContext.taskId,
        error: e.message,
        durationMs: Date.now() - startTime
      };
    }
  }
}
