import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get("orderNumber");

    if (!orderNumber) {
      return NextResponse.json({ success: false, error: "Missing order number" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: { items: true }
    });

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    // Return the safe order data
    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error("Track Error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
