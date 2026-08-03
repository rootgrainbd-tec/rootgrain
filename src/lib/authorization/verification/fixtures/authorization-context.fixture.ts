import { AuthorizationContext } from "../../types/authorization-context";

export class AuthorizationContextFixture {
  static readonly defaultAdmin: AuthorizationContext = {
    userId: "admin-1",
    principal: "ADMIN",
    permissions: ["*"],
    roles: ["SUPER_ADMIN"],
    resource: "any",
    action: "any",
    timestamp: new Date("2026-01-01T00:00:00Z"),
  };

  static readonly defaultCustomer: AuthorizationContext = {
    userId: "customer-1",
    principal: "CUSTOMER",
    permissions: ["read:own"],
    roles: ["USER"],
    resource: "orders",
    action: "read",
    timestamp: new Date("2026-01-01T00:00:00Z"),
  };

  static create(overrides: Partial<AuthorizationContext>): AuthorizationContext {
    return {
      ...this.defaultCustomer,
      ...overrides,
    };
  }
}
