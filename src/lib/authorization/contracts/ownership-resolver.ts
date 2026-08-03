import { AuthorizationContext } from "../types/authorization-context";

export interface IOwnershipResolver {
  verifyOwnership(context: AuthorizationContext): Promise<boolean>;
}
