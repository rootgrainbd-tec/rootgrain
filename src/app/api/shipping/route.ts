import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const rates = await prisma.shippingRate.findMany({
      orderBy: { district: 'asc' }
    });
    
    return NextResponse.json(rates);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch shipping rates" }, { status: 500 });
  }
}
