export const Permissions = {
  PRODUCTS_CREATE: "products:create",
  PRODUCTS_READ: "products:read",
  PRODUCTS_UPDATE: "products:update",
  PRODUCTS_DELETE: "products:delete",

  ORDERS_CREATE: "orders:create",
  ORDERS_READ: "orders:read",
  ORDERS_UPDATE: "orders:update",
  ORDERS_REFUND: "orders:refund",

  INVENTORY_READ: "inventory:read",
  INVENTORY_UPDATE: "inventory:update",

  USERS_READ: "users:read",
  USERS_UPDATE: "users:update",

  ANALYTICS_READ: "analytics:read",
  CMS_UPDATE: "cms:update",
  SETTINGS_UPDATE: "settings:update",
  PII_READ: "pii:read",

  ROLES_UPDATE: "roles:update",
  PERMISSIONS_UPDATE: "permissions:update",
  AUDIT_READ: "audit:read",
  FEATURE_FLAGS_UPDATE: "feature_flags:update",
} as const;

export type PermissionKey = keyof typeof Permissions;
export type PermissionValue = typeof Permissions[PermissionKey];
