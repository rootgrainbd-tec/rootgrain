import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const products = await prisma.product.findMany({ select: { id: true, name: true, price: true } });
  console.log("Prisma Products:", products.length, products);
}
main();
