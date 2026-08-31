import { Role } from "@prisma/client";
import { requirePermission } from "../src/lib/rbac";
import prisma from "../src/lib/prisma";
import { AppError } from "../src/lib/errors/AppError";
import { describe, beforeAll, afterEach, it, expect, vi } from "vitest";

// Mock getServerSession
vi.mock("next-auth/next", () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from "next-auth/next";

describe("RBAC Architecture", () => {
  beforeAll(async () => {
    // Seed test user and permissions
    const permission = await prisma.permission.upsert({
      where: { name: "test.manage" },
      update: {},
      create: { name: "test.manage", description: "Test permission" },
    });

    const user = await prisma.user.upsert({
      where: { email: "rbac_test@example.com" },
      update: { role: Role.ADMIN },
      create: {
        email: "rbac_test@example.com",
        name: "RBAC Test User",
        role: Role.ADMIN,
      },
    });

    await prisma.rolePermission.upsert({
      where: {
        role_permissionId: {
          role: Role.ADMIN,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        role: Role.ADMIN,
        permissionId: permission.id,
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated requests", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null);

    await expect(requirePermission("test.manage")).rejects.toThrow(
      new AppError("Forbidden: Unauthenticated", 401)
    );
  });

  it("grants permission via Role", async () => {
    const user = await prisma.user.findUnique({ where: { email: "rbac_test@example.com" } });
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: user!.id, role: Role.ADMIN },
    } as any);

    const result = await requirePermission("test.manage");
    expect(result.id).toBe(user!.id);
    expect(result.role).toBe(Role.ADMIN);
  });

  it("rejects permission if not granted via Role or User", async () => {
    const user = await prisma.user.findUnique({ where: { email: "rbac_test@example.com" } });
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: user!.id, role: Role.USER }, // Mocking as USER
    } as any);

    await expect(requirePermission("test.manage")).rejects.toThrow(
      new AppError("Forbidden: Missing required permission [test.manage]", 403)
    );
  });
});

