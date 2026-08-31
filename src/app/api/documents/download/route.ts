import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getStorageAdapter } from "@/lib/infrastructure/storage";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("documentId");

    if (!documentId) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const document = await prisma.orderDocument.findUnique({
      where: { id: documentId },
      include: {
        order: {
          select: { userId: true },
        },
      },
    });

    if (!document || !document.order || document.order.userId !== session.user.id) {
      return new NextResponse("Not Found", { status: 404 });
    }

    if (document.documentType !== "FINAL_INVOICE") {
      return new NextResponse("Not Found", { status: 404 });
    }

    if (!document.storageKey) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const adapter = getStorageAdapter();
    const signedUrl = await adapter.getSignedUrl(document.storageKey);

    return NextResponse.redirect(signedUrl, 302);
  } catch (error) {
    console.error("Error generating signed URL for document:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
