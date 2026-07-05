import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rates = await prisma.shippingRate.findMany({
      orderBy: { district: 'asc' }
    });
    
    return NextResponse.json(rates);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch shipping rates" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { district, baseRate, perItemRate } = body;

    if (!district || baseRate === undefined || perItemRate === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const rate = await prisma.shippingRate.upsert({
      where: { district },
      update: { baseRate: Number(baseRate), perItemRate: Number(perItemRate) },
      create: { district, baseRate: Number(baseRate), perItemRate: Number(perItemRate) },
    });

    return NextResponse.json(rate);
  } catch (error) {
    return NextResponse.json({ error: "Failed to save shipping rate" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    await prisma.shippingRate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete shipping rate" }, { status: 500 });
  }
}
