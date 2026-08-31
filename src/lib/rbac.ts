import { Role } from "@prisma/client";
import prisma from "./prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";
import { cache } from "react";
import { AppError } from "./errors/AppError";

/**
 * Resolves effective permissions for a user from the database.
 * The result is cached for the lifecycle of a single request via React `cache()`.
 */
export const getEffectivePermissions = cache(async (userId: string, role: Role): Promise<Set<string>> => {
  // Additive Union: Role Permissions + User Permissions
  const [rolePerms, userPerms] = await Promise.all([
    prisma.rolePermission.findMany({
      where: { role },
      include: { permission: true },
    }),
    prisma.userPermission.findMany({
      where: { userId },
      include: { permission: true },
    }),
  ]);

  const effective = new Set<string>();

  rolePerms.forEach((rp) => effective.add(rp.permission.name));
  userPerms.forEach((up) => effective.add(up.permission.name));

  return effective;
});

/**
 * Canonical Authorization API.
 * 1. Authenticates server session
 * 2. Resolves effective permissions from database
 * 3. Exact permission match
 * 4. Throws 403 AppError if missing
 */
export async function requirePermission(permissionName: string): Promise<{ id: string; role: Role }> {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id || !(session.user as any).role) {
    throw new AppError("Forbidden: Unauthenticated", 401);
  }

  const userId = session.user.id;
  const role = (session.user as any).role as Role;

  const permissions = await getEffectivePermissions(userId, role);

  if (!permissions.has(permissionName)) {
    throw new AppError(`Forbidden: Missing required permission [${permissionName}]`, 403);
  }

  return { id: userId, role };
}
