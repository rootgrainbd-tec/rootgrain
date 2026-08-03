import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedAuthorization() {
  console.log("Seeding Authorization Foundation... (Skipped - models not in schema)");
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
