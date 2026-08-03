import { TaskContract } from '../contracts/task.contract';

export interface TaskDefinition {
  readonly definition_id: string;
  readonly contract: TaskContract;
  readonly dependencies: ReadonlyArray<string>;
}
