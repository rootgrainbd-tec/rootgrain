import { WorkflowContract } from '../contracts/workflow.contract';
import { ProcessContract } from '../contracts/process.contract';
import { TaskContract } from '../contracts/task.contract';
import { WorkflowException } from '../exceptions/workflow.exception';

export class WorkflowRegistry {
  private static workflows = new Map<string, WorkflowContract>();
  private static processes = new Map<string, ProcessContract>();
  private static tasks = new Map<string, TaskContract>();

  static registerWorkflow(contract: WorkflowContract): void {
     if (this.workflows.has(contract.workflow_id)) throw WorkflowException.validation("Duplicate Workflow ID");
     this.workflows.set(contract.workflow_id, contract);
  }

  static registerProcess(contract: ProcessContract): void {
     if (this.processes.has(contract.process_id)) throw WorkflowException.validation("Duplicate Process ID");
     this.processes.set(contract.process_id, contract);
  }

  static registerTask(contract: TaskContract): void {
     if (this.tasks.has(contract.task_id)) throw WorkflowException.validation("Duplicate Task ID");
     this.tasks.set(contract.task_id, contract);
  }
}
