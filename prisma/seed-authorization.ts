import { PrismaClient, PermissionEffect } from "@prisma/client";
import { Permissions } from "../src/lib/authorization/PermissionRegistry";

const prisma = new PrismaClient();

export async function seedAuthorization() {
  console.log("Seeding Authorization Foundation...");

  // 1. Create Core Roles
  const roles = [
    { id: "SUPER_ADMIN", description: "System Administrator - Bypasses all explicit checks" },
    { id: "ADMIN", description: "Store Administrator" },
    { id: "STAFF", description: "General Staff" },
    { id: "CUSTOMER", description: "Standard Authenticated Customer" },
    { id: "GUEST", description: "Anonymous or Guest Checkout User" },
  ];

  for (const role of roles) {
    await prisma.authRole.upsert({
      where: { id: role.id },
      update: {},
      create: role,
    });
  }

  // 2. Create Permissions from Registry
  const permissionIds = Object.values(Permissions);
  for (const id of permissionIds) {
    await prisma.permission.upsert({
      where: { id },
      update: {},
      create: { id, description: `Permission for ${id}` },
    });
  }

  // 3. Assign Default Admin Permissions (SUPER_ADMIN gets bypassed, so we just seed ADMIN)
  const adminPermissions = permissionIds; // Admin gets everything except what's hard-blocked
  for (const permissionId of adminPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: "ADMIN",
          permissionId,
        },
      },
      update: {},
      create: {
        roleId: "ADMIN",
        permissionId,
      },
    });
  }

  console.log("Authorization seeding completed successfully.");
}

// Allow direct execution
if (require.main === module) {
  seedAuthorization()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
