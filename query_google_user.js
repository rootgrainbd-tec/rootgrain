const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const latestGoogleAccount = await prisma.account.findFirst({
    where: { provider: 'google' },
    orderBy: { createdAt: 'desc' },
    include: { user: true }
  });

  if (!latestGoogleAccount) {
    console.log("No Google accounts found.");
    return;
  }

  const user = latestGoogleAccount.user;
  console.log("--- Google User Record ---");
  console.log(`id: ${user.id}`);
  console.log(`email: ${user.email}`);
  console.log(`provider: ${latestGoogleAccount.provider}`);
  console.log(`emailVerified: ${user.emailVerified}`);
  console.log(`createdAt: ${user.createdAt}`);
  console.log(`updatedAt: ${user.updatedAt}`);
  
  if (user.emailVerified === null) {
    console.log("Result: emailVerified IS NULL.");
  } else {
    console.log("Result: emailVerified is NOT null.");
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
