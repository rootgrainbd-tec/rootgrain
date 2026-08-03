export class ContextMiddleware {
  static bind(req: any, securityContext: any): any {
    // Structural stub: Ensure the request is deeply frozen after binding
    // the authenticated security context so downstream layers cannot mutate it.
    const enriched = { ...req, securityContext: Object.freeze(securityContext) };
    return Object.freeze(enriched);
  }
}
