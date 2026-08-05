const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const accounts = await prisma.$queryRawUnsafe('SELECT column_name, data_type FROM information_schema.columns WHERE table_name = \'Account\';');
  console.log(accounts);
}
main().catch(console.error).finally(() => prisma.$disconnect());
