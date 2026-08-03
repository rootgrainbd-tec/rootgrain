import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  const tokenDefault = await getToken({ req });
  const tokenWithSecret = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  
  const cookieName = process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://") ? "__Secure-next-auth.session-token" : "next-auth.session-token";
  const tokenWithAll = await getToken({ req, secret: process.env.NEXTAUTH_SECRET, cookieName });

  const cookies = req.cookies.getAll();

  return NextResponse.json({
    tokenDefault: tokenDefault ? "FOUND" : "MISSING",
    tokenWithSecret: tokenWithSecret ? "FOUND" : "MISSING",
    tokenWithAll: tokenWithAll ? "FOUND" : "MISSING",
    cookies: cookies.map(c => c.name),
    env: {
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    }
  });
}
