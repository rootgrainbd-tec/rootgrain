export class PermissionScope {
  static evaluateSubScope(requestedScope: string, grantedScope: string): boolean {
     // Mathematical representation: return true if requestedScope is subset of grantedScope
     return requestedScope === grantedScope;
  }
}
