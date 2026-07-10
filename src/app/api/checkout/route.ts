import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { client } from "../../../../sanity/lib/client";
import { sendOrderConfirmationEmail } from "@/lib/email";

function generateOrderNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(100000 + Math.random() * 900000);
  return `RG-${date}-${random}`;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { items, address, division, district, promoCode } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    if (!district || !address.name || !address.phone || !address.email || !address.street) {
      return NextResponse.json({ error: "Missing address details" }, { status: 400 });
    }

    // Fetch product prices to prevent client-side tampering
    const productIds = items.map((i: any) => i.id);
    const dbProducts = await client.fetch(`
      *[_type == "product" && slug.current in $slugs] {
        "id": slug.current,
        "name": title,
        price,
        availability
      }
    `, { slugs: productIds });

    let subtotal = 0;
    const orderItemsData = items.map((item: any) => {
      const dbProd = dbProducts.find((p: any) => p.id === item.id);
      if (!dbProd) throw new Error(`Product not found: ${item.id}`);
      if (dbProd.availability === "Sold") throw new Error(`Product ${dbProd.name} is currently out of stock.`);
      
      const itemTotal = dbProd.price * item.quantity;
      subtotal += itemTotal;
      
      return {
        productId: item.id,
        productName: dbProd.name,
        quantity: item.quantity,
        unitPrice: dbProd.price,
        total: itemTotal
      };
    });

    // Calculate shipping
    const shippingRate = await prisma.shippingRate.findUnique({
      where: { district }
    });

    if (!shippingRate) {
      return NextResponse.json({ error: "Shipping is not available for this district." }, { status: 400 });
    }

    const totalQuantity = items.reduce((acc: number, item: any) => acc + item.quantity, 0);
    let shippingCost = shippingRate.baseRate;
    if (totalQuantity > 1) {
      shippingCost += (totalQuantity - 1) * shippingRate.perItemRate;
    }

    let discountAmount = 0;
    
    // Validate and apply promo code
    if (promoCode) {
      const promo = await prisma.promoCode.findUnique({
        where: { code: promoCode.toUpperCase() }
      });

      if (promo && promo.isActive && (!promo.expiryDate || new Date() <= promo.expiryDate) && (promo.maxUses === null || promo.currentUses < promo.maxUses)) {
        if (promo.discountType === "PERCENTAGE") {
          discountAmount = Math.floor(subtotal * (promo.discountValue / 100));
        } else {
          discountAmount = promo.discountValue;
        }

        if (discountAmount > subtotal) {
          discountAmount = subtotal;
        }

        // Increment usage
        await prisma.promoCode.update({
          where: { id: promo.id },
          data: { currentUses: { increment: 1 } }
        });
      }
    }

    const total = subtotal + shippingCost - discountAmount;
    const balanceDue = total;

    let userId = session?.user ? session.user.id : null;
    
    // If not logged in, check if an account exists with this email
    if (!userId && address.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: address.email }
      });
      if (existingUser) {
        userId = existingUser.id;
      }
    }

    // Create Order
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: userId,
        subtotal,
        shippingCost,
        total,
        balanceDue,
        promoCode,
        discountAmount,
        status: "PENDING_ADVANCE",
        logistics: "PRIVATE_FREIGHT",
        shippingAddress: {
          name: address.name,
          email: address.email,
          phone: address.phone,
          division: division,
          district: district,
          street: address.street,
          postCode: address.postCode,
        },
        items: {
          create: orderItemsData
        }
      },
      include: { items: true }
    });

    // Send order confirmation email without blocking the response
    sendOrderConfirmationEmail(order, address.email).catch(console.error);

    return NextResponse.json({ success: true, orderId: order.id, orderNumber: order.orderNumber });
  } catch (error: any) {
    console.error("Checkout Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process checkout" }, { status: 500 });
  }
}
