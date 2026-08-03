export interface RouteDefinition {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  handler: string;
  middlewares?: string[];
}

export class RouteRegistry {
  private routes: RouteDefinition[] = [];

  register(route: RouteDefinition): void {
    // Ensuring route definitions are strictly immutable upon registration
    this.routes.push(Object.freeze({ ...route }));
  }

  getRoutes(): ReadonlyArray<RouteDefinition> {
    return Object.freeze([...this.routes]);
  }
}
