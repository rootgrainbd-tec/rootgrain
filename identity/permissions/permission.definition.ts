import { PermissionContract } from '../contracts/permission.contract';

export interface PermissionDefinition {
  readonly definition_id: string;
  readonly contract: PermissionContract;
  readonly implied_permissions: ReadonlyArray<string>;
}
