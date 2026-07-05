import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    await prisma.wishlist.delete({
      where: { 
        id: id,
      },
    });

    return NextResponse.json({ message: "Wishlist item deleted" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: String(error) }, { status: 500 });
  }
}
