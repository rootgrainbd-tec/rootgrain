import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit, getAccountTargetKey, RateLimitCategory } from "@/lib/rate-limit";
import { SESSION_COOKIE_NAME } from "@/lib/auth/cookies";

function getIpKey(req: NextRequest): string {
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  const realIp = ip.split(',')[0].trim();
  if (realIp.includes(":")) {
    const parts = realIp.split(":");
    return parts.slice(0, 4).join(":");
  }
  return realIp;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  let category: RateLimitCategory | null = null;
  let requireL2Auth = false;

  if (pathname === "/api/v1/auth/login") {
    category = "credentials";
    requireL2Auth = true;
  } else if (pathname === "/api/v1/auth/register") {
    category = "register";
  } else if (pathname === "/api/v1/auth/verify-email") {
    category = "verify";
  } else if (pathname === "/api/v1/auth/forgot-password" || pathname === "/api/v1/auth/reset-password") {
    category = "forgot_password";
    requireL2Auth = true;
  } else if (pathname.startsWith("/api/checkout")) {
    category = "checkout";
  } else if (pathname.startsWith("/api/cart")) {
    category = "cart";
  } else if (pathname.startsWith("/api/user/wishlist")) {
    category = "wishlist";
  } else if (pathname.startsWith("/api/reviews")) {
    category = "reviews";
  } else if (pathname.startsWith("/api/user/profile") || pathname.startsWith("/api/user/address") || pathname.startsWith("/api/user/orders")) {
    category = "profile";
  } else if (pathname.startsWith("/api/admin")) {
    category = "admin_api";
  } else if (pathname.startsWith("/api/cron")) {
    category = "cron_internal";
  } else if (pathname === "/api/inquiry") {
    category = "contact";
  } else if (pathname === "/api/track") {
    category = "track";
  }
  
  const isL2Only = ["wishlist", "reviews", "profile", "admin_api"].includes(category || "");

  const ipKey = getIpKey(req);
  let l1Result: any = null;
  
  if (category && !isL2Only) {
    l1Result = await checkRateLimit(ipKey, category);
    if (!l1Result.success) {
      return buildRateLimitResponse(429, l1Result);
    }
  }

  let l2Result: any = null;
  
  // For endpoints like login, if an email is provided in the body, rate limit by that email too.
  if (category && requireL2Auth && req.method === "POST") {
    try {
      const contentType = req.headers.get("content-type") || "";
      let email = "";
      if (contentType.includes("application/json")) {
        const body = await req.clone().json();
        email = body?.email;
      } else if (contentType.includes("application/x-www-form-urlencoded")) {
        const formData = await req.clone().formData();
        email = formData.get("email") as string;
      }
      
      if (email) {
        const targetKey = await getAccountTargetKey(email);
        l2Result = await checkRateLimit(targetKey, category);
        if (!l2Result.success) {
          return buildRateLimitResponse(429, l2Result);
        }
      }
    } catch (e) {
      console.error("Middleware body parse error", e);
    }
  }

  const hasSession = 
    req.cookies.has(SESSION_COOKIE_NAME) || 
    req.cookies.has("next-auth.session-token") || 
    req.cookies.has("__Secure-next-auth.session-token");
  const isAdminRoute = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  const isAccountRoute = pathname.startsWith("/account") || pathname.startsWith("/api/user");

  // Soft route protection. Strict checking happens in API handlers / Server Components.
  if ((isAdminRoute || isAccountRoute) && !hasSession) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const response = NextResponse.next();
  const finalResult = l2Result && (!l1Result || l2Result.remaining < l1Result.remaining) ? l2Result : l1Result;
  if (finalResult) {
    appendRateLimitHeaders(response, finalResult);
  }
  
  return response;
}

function buildRateLimitResponse(status: number, result: any) {
  const response = new NextResponse("Too Many Requests", { status });
  appendRateLimitHeaders(response, result);
  response.headers.set("Retry-After", Math.ceil((result.reset - Date.now()) / 1000).toString());
  return response;
}

function appendRateLimitHeaders(response: NextResponse, result: any) {
  response.headers.set("X-RateLimit-Limit", result.limit.toString());
  response.headers.set("X-RateLimit-Remaining", Math.max(0, result.remaining).toString());
  response.headers.set("X-RateLimit-Reset", result.reset.toString());
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
