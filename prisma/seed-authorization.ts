import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

const PERMISSIONS = [
  { name: "payment.record", description: "Legacy functionality migration target" },
  { name: "payment.void", description: "Future Phase 8 permission (Slice 2)" },
  { name: "advance.revise", description: "Future Phase 8 permission (Slice 3)" },
  { name: "price.revise", description: "Future Phase 8 permission (Slice 4)" },
  { name: "custom_request.manage", description: "Legacy functionality migration target" },
  { name: "order.manage", description: "Legacy functionality migration target" },
  { name: "review.manage", description: "Legacy functionality migration target" },
];

export async function seedAuthorization() {
  console.log("Seeding Authorization Foundation...");

  for (const perm of PERMISSIONS) {
    const permission = await prisma.permission.upsert({
      where: { name: perm.name },
      update: { description: perm.description },
      create: { name: perm.name, description: perm.description },
    });

    console.log(`Seeded permission: ${permission.name}`);

    // Map ALL seven permissions to Role.ADMIN
    await prisma.rolePermission.upsert({
      where: {
        role_permissionId: {
          role: Role.ADMIN,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        role: Role.ADMIN,
        permissionId: permission.id,
      },
    });

    console.log(`Mapped permission ${permission.name} to ADMIN`);
  }

  console.log("Authorization Foundation seeding complete.");
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
