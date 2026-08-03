import { AuthorizationMiddleware } from '../middleware/authorization.middleware';

export class AuthorizationGuard {
  static canActivate(req: any): boolean {
    try {
      AuthorizationMiddleware.process(req);
      return true;
    } catch {
      return false;
    }
  }
}
