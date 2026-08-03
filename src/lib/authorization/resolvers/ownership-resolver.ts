import { IOwnershipResolver } from "../contracts/ownership-resolver";
import { AuthorizationContext } from "../types/authorization-context";

export class OwnershipResolver implements IOwnershipResolver {
  async verifyOwnership(context: AuthorizationContext): Promise<boolean> {
    if (!context.ownerId && !context.guestTokenHash) {
      return false;
    }

    if (context.userId && context.ownerId) {
      if (context.userId === context.ownerId) {
        return true;
      }
    }

    if (context.sessionId && context.guestTokenHash) {
      if (context.sessionId === context.guestTokenHash) {
        return true;
      }
    }

    return false;
  }
}
