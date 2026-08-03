import { AuthenticationMiddleware } from '../middleware/authentication.middleware';

export class AuthenticationGuard {
  static canActivate(req: any): boolean {
    try {
      AuthenticationMiddleware.process(req);
      return true;
    } catch {
      return false;
    }
  }
}
