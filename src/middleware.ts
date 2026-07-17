import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    const isAdminRoute = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
    const isAccountRoute = pathname.startsWith("/account") || pathname.startsWith("/api/user");

    // Prevent non-admin users from accessing admin routes
    if (isAdminRoute && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Prevent unauthenticated users from accessing account routes
    if (isAccountRoute && !token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Return true to always run the middleware function above, where we handle the redirect manually
      authorized: () => true,
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*", 
    "/account/:path*", 
    "/api/admin/:path*", 
    "/api/user/:path*"
  ],
};
