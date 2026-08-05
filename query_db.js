const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.production.local' });
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } }
});
async function run() {
  const user = await prisma.user.findUnique({ where: { email: 'test.verify.fixed.1785939365.81498@example.com' } });
  console.log('User:', user);
  if (user) {
    const token = await prisma.verificationToken.findFirst({ where: { userId: user.id } });
    console.log('Token:', token);
  }
}
run().finally(() => prisma.$disconnect());
