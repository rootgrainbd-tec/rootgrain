import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Fix Products
  const products = await prisma.product.findMany();
  for (const p of products) {
    if (p.price > 1000000) { // Probably Paisa
      await prisma.product.update({
        where: { id: p.id },
        data: { price: Math.floor(p.price / 100) }
      });
    }
  }

  // Fix Shipping Rates
  const rates = await prisma.shippingRate.findMany();
  for (const r of rates) {
    if (r.baseRate >= 1000) { // Probably Paisa
      await prisma.shippingRate.update({
        where: { id: r.id },
        data: { 
          baseRate: Math.floor(r.baseRate / 100),
          perItemRate: Math.floor(r.perItemRate / 100)
        }
      });
    }
  }

  // Fix Promo Codes (FLAT)
  const promos = await prisma.promoCode.findMany({ where: { discountType: 'FLAT' } });
  for (const p of promos) {
    if (p.discountValue >= 1000) { // Probably Paisa
      await prisma.promoCode.update({
        where: { id: p.id },
        data: { discountValue: Math.floor(p.discountValue / 100) }
      });
    }
  }
  
  // Fix Orders
  const orders = await prisma.order.findMany();
  for (const o of orders) {
    if (o.total > 1000000) {
      await prisma.order.update({
        where: { id: o.id },
        data: {
          subtotal: Math.floor(o.subtotal / 100),
          shippingCost: Math.floor(o.shippingCost / 100),
          total: Math.floor(o.total / 100),
          balanceDue: Math.floor(o.balanceDue / 100),
          advancePaid: Math.floor(o.advancePaid / 100),
          discountAmount: Math.floor(o.discountAmount / 100)
        }
      });
    }
  }

  console.log("Migration complete!");
}

main();
