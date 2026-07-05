import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const coupons = await prisma.promoCode.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(coupons);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch coupons" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { code, discountType, discountValue, maxUses, expiryDate } = body;

    const coupon = await prisma.promoCode.create({
      data: {
        code: code.toUpperCase(),
        discountType,
        discountValue: parseInt(discountValue),
        maxUses: maxUses ? parseInt(maxUses) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
      },
    });

    return NextResponse.json(coupon);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Coupon code already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create coupon" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    await prisma.promoCode.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete coupon" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, isActive } = body;

    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    const coupon = await prisma.promoCode.update({
      where: { id },
      data: { isActive }
    });

    return NextResponse.json(coupon);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update coupon" }, { status: 500 });
  }
}
