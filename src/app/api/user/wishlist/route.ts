import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    const data = await req.json();
    
    if (!data.productId) {
      return NextResponse.json({ message: "Missing productId" }, { status: 400 });
    }

    // Upsert or create to avoid Unique constraint error if they click twice
    const wishlistItem = await prisma.wishlist.upsert({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId: data.productId
        }
      },
      update: {},
      create: {
        userId: session.user.id,
        productId: data.productId
      }
    });

    return NextResponse.json({ wishlistItem }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: String(error) }, { status: 500 });
  }
}
