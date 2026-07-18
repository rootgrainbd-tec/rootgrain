import { NextResponse } from "next/server";
import { client } from "../../../../sanity/lib/client";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { message: "Valid email is required" },
        { status: 400 }
      );
    }

    // Use token if available, otherwise it might fail if dataset is not public write
    const writeClient = client.withConfig({
      token: process.env.SANITY_API_WRITE_TOKEN,
    });

    await writeClient.create({
      _type: "subscriber",
      email: email,
      subscribedAt: new Date().toISOString(),
    });

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

