import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');

    if (!productId) return NextResponse.json({ error: "Missing product ID" }, { status: 400 });

    const reviews = await prisma.review.findMany({
      where: { productId, status: "APPROVED" },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(reviews);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "You must be logged in to leave a review." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { productId, rating, comment } = body;

    if (!productId || !rating) {
      return NextResponse.json({ error: "Product ID and Rating are required." }, { status: 400 });
    }

    // Check if user already reviewed this product
    const existing = await prisma.review.findFirst({
      where: {
        userId: session.user.id,
        productId,
      }
    });

    if (existing) {
      return NextResponse.json({ error: "You have already reviewed this product." }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: {
        userId: session.user.id,
        productId,
        rating: parseInt(rating),
        comment,
        status: "PENDING"
      }
    });

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error("Review creation error:", error);
    return NextResponse.json({ error: "Failed to submit review." }, { status: 500 });
  }
}
