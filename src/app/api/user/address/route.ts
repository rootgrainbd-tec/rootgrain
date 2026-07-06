import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    const addresses = await prisma.address.findMany({
      where: { userId: session.user.id },
      orderBy: { isDefault: 'desc' }
    });

    return NextResponse.json(addresses, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    const data = await req.json();
    
    // Create the address
    const address = await prisma.address.create({
      data: {
        userId: session.user.id,
        name: data.name || "Home",
        phone: data.phone,
        division: data.division,
        district: data.district,
        street: data.street,
        postCode: data.postCode,
        isDefault: data.isDefault || false
      }
    });

    return NextResponse.json({ address }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: String(error) }, { status: 500 });
  }
}
