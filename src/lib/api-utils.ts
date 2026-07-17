import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { AppError } from "./errors/AppError";
import { Role } from "@prisma/client";

type RouteHandler = (req: NextRequest, ctx: any) => Promise<NextResponse> | NextResponse;
type AuthenticatedRouteHandler = (req: NextRequest, ctx: any, session: any) => Promise<NextResponse> | NextResponse;

export function successResponse(data: any = null, message?: string, meta?: any) {
  return NextResponse.json({
    success: true,
    ...(message && { message }),
    ...(data && { data }),
    ...(meta && { meta })
  }, { status: 200 });
}

export function errorResponse(message: string, status: number = 500, code: string = "INTERNAL_ERROR") {
  return NextResponse.json({
    success: false,
    error: { message, status, code }
  }, { status });
}

export function handleAppError(error: unknown) {
  if (error instanceof AppError) {
    return errorResponse(error.message, error.statusCode, error.name.toUpperCase());
  }
  
  import("./logger").then(({ logger }) => {
    logger.error({ err: error }, "[API Error]");
  });
  
  return errorResponse("Internal Server Error", 500, "INTERNAL_ERROR");
}

export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (req: NextRequest, ctx: any) => {
    try {
      return await handler(req, ctx);
    } catch (error) {
      return handleAppError(error);
    }
  };
}

export function withRole(allowedRoles?: readonly Role[], handler?: AuthenticatedRouteHandler): RouteHandler {
  return withErrorHandler(async (req: NextRequest, ctx: any) => {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return errorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    if (allowedRoles && allowedRoles.length > 0) {
      const userRole = (session.user as any).role as Role;
      if (!allowedRoles.includes(userRole)) {
        return errorResponse("Forbidden: Insufficient permissions", 403, "FORBIDDEN");
      }
    }

    if (!handler) {
      throw new Error("Handler is required");
    }
    
    return handler(req, ctx, session);
  });
}

export function withAuth(handler: AuthenticatedRouteHandler): RouteHandler {
  return withRole([], handler);
}

export function withAdmin(handler: AuthenticatedRouteHandler): RouteHandler {
  return withRole([Role.ADMIN], handler);
}


