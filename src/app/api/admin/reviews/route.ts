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
    const reviews = await prisma.review.findMany({
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(reviews);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) return NextResponse.json({ error: "Missing data" }, { status: 400 });

    const review = await prisma.review.update({
      where: { id },
      data: { status }
    });

    return NextResponse.json(review);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
  }
}
