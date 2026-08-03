export class PolicyFixture {
  static readonly requireAdmin = {
    name: "requireAdmin",
    effect: "ALLOW",
    condition: "principal === 'ADMIN'",
  };

  static readonly maintenanceMode = {
    name: "maintenanceMode",
    effect: "DENY",
    condition: "true",
  };
}
