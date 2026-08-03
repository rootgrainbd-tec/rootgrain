import { RoleContract } from '../contracts/role.contract';

export interface RoleDefinition {
  readonly definition_id: string;
  readonly contract: RoleContract;
  readonly included_permissions: ReadonlyArray<string>;
}
