import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { Prisma } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { message: "Valid email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    try {
      await prisma.subscriber.create({
        data: {
          email: normalizedEmail,
        },
      });
    } catch (dbError) {
      // Handle unique constraint violation gracefully
      if (dbError instanceof Prisma.PrismaClientKnownRequestError && dbError.code === "P2002") {
        logger.info("Duplicate subscription attempt handled gracefully");
        return NextResponse.json(
          { message: "Subscribed successfully" },
          { status: 200 }
        );
      }
      throw dbError; // rethrow to be caught by the outer catch
    }

    return NextResponse.json(
      { message: "Subscribed successfully" },
      { status: 200 }
    );
  } catch (error) {
    logger.error({ err: error }, "Subscription error");
    return NextResponse.json(
      { message: "Failed to subscribe" },
      { status: 500 }
    );
  }
}

