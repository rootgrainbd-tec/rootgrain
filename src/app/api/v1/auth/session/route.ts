import { NextRequest } from 'next/server';
import { withErrorHandler, successResponse, errorResponse } from '@/lib/api-utils';
import { getSessionToken, clearSessionCookie } from '@/lib/auth/cookies';
import { SessionService } from '@/services/session.service';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const GET = withErrorHandler(async (req: NextRequest) => {
  // 1. Check for NextAuth session integration
  const nextAuthSession = await getServerSession(authOptions);
  
  if (nextAuthSession?.user?.email) {
    const dbUser = await prisma.user.findUnique({ 
      where: { email: nextAuthSession.user.email } 
    });
    
    if (dbUser) {
      return successResponse({
        isAuthenticated: true,
        user: {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          role: dbUser.role,
          emailVerified: dbUser.emailVerified !== null,
        },
        sessionExpiresAt: new Date(nextAuthSession.expires)
      });
    }
  }

  // 2. Fall back to legacy custom session mechanism
  const token = await getSessionToken();
  
  if (!token) {
    return errorResponse('Not authenticated', 401);
  }
  
  const session = await SessionService.validateSession(token);

  if (!session) {
    // Invalid or expired session, clear the cookie
    await clearSessionCookie();
    return errorResponse('Session expired or invalid', 401);
  }

  return successResponse({
    isAuthenticated: true,
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
      emailVerified: session.user.emailVerified,
    },
    sessionExpiresAt: session.expiresAt
  });
});
