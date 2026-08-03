// Specific delegation guard if frameworks require granular attachment
import { AuthorizationMiddleware } from '../middleware/authorization.middleware';

export class PermissionGuard {
  static canActivate(req: any): boolean {
    try {
      AuthorizationMiddleware.process(req);
      return true;
    } catch {
      return false;
    }
  }
}
