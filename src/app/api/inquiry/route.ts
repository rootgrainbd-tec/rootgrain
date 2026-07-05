import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    if (!data.name || !data.phone || !data.message) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const inquiry = await prisma.inquiry.create({
      data: {
        name: data.name,
        phone: data.phone,
        message: data.message,
        productId: data.productId || null,
      }
    });

    return NextResponse.json({ inquiry, message: "Inquiry submitted successfully" }, { status: 201 });
  } catch (error) {
    console.error("Inquiry Submission Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
