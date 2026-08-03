export class PermissionFixture {
  static readonly allowAll = {
    resource: "*",
    action: "*",
  };

  static readonly readOrders = {
    resource: "orders",
    action: "read",
  };
}
