import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const test = async () => {
  const user = await prisma.user.findFirst({
    where: { emailVerified: true }
  });
  console.log('Verified User:', user.email);
  await prisma.$disconnect();
};

test().catch(console.error);
