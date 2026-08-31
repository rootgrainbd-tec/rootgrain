import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import prisma from "@/lib/prisma";
import { POST } from "@/app/api/user/wishlist/route";
import { NextRequest } from "next/server";

const mockSession = {
  user: {
    id: "user-test-1",
    role: "USER"
  }
};

const mockSession2 = {
  user: {
    id: "user-test-2",
    role: "USER"
  }
};

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(() => Promise.resolve(mockSession))
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {}
}));

describe("Phase 10 Slice 1: Wishlist Toggle Feature", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await prisma.wishlist.deleteMany({});
    await prisma.user.deleteMany({ where: { id: { in: ["user-test-1", "user-test-2"] } } });
    await prisma.user.create({ data: { id: "user-test-1", name: "Test 1", email: "test1@example.com" } });
    await prisma.user.create({ data: { id: "user-test-2", name: "Test 2", email: "test2@example.com" } });
  });

  afterEach(async () => {
    await prisma.wishlist.deleteMany({});
    await prisma.user.deleteMany({ where: { id: { in: ["user-test-1", "user-test-2"] } } });
  });

  const createReq = (productId: string) => {
    return new NextRequest("http://localhost/api/user/wishlist", {
      method: "POST",
      body: JSON.stringify({ productId })
    });
  };

  it("1. Add absent product", async () => {
    const req = createReq("prod-1");
    const res = await POST(req as any, {} as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.action).toBe("added");
    expect(json.data.wishlistItem.productId).toBe("prod-1");

    const dbItems = await prisma.wishlist.findMany({ where: { userId: "user-test-1" }});
    expect(dbItems.length).toBe(1);
    expect(dbItems[0].productId).toBe("prod-1");
  });

  it("2. Toggle removes item (second click)", async () => {
    await prisma.wishlist.create({ data: { userId: "user-test-1", productId: "prod-1" }});

    const req = createReq("prod-1");
    const res = await POST(req as any, {} as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.action).toBe("removed");

    const dbItems = await prisma.wishlist.findMany({ where: { userId: "user-test-1" }});
    expect(dbItems.length).toBe(0);
  });

  it("3. Add again after removal (third click)", async () => {
    // Add
    let req = createReq("prod-1");
    await POST(req as any, {} as any);
    
    // Remove
    req = createReq("prod-1");
    await POST(req as any, {} as any);
    
    // Add again
    req = createReq("prod-1");
    const res = await POST(req as any, {} as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.action).toBe("added");

    const dbItems = await prisma.wishlist.findMany({ where: { userId: "user-test-1" }});
    expect(dbItems.length).toBe(1);
  });

  it("4. Multi-user isolation", async () => {
    // User 1 adds
    let req = createReq("prod-1");
    await POST(req as any, {} as any);

    // Mock User 2
    const { getServerSession } = await import("next-auth");
    vi.mocked(getServerSession).mockResolvedValueOnce(mockSession2 as any);

    // User 2 adds same product
    req = createReq("prod-1");
    const res2 = await POST(req as any, {} as any);
    const json2 = await res2.json();

    expect(res2.status).toBe(200);
    expect(json2.data.action).toBe("added");

    // Verify DB has 2 records, one for each user
    const dbItems = await prisma.wishlist.findMany({});
    expect(dbItems.length).toBe(2);

    // User 1 removes
    vi.mocked(getServerSession).mockResolvedValueOnce(mockSession as any);
    req = createReq("prod-1");
    const resRemove = await POST(req as any, {} as any);
    expect((await resRemove.json()).data.action).toBe("removed");

    // User 2 should still have theirs
    const user2Items = await prisma.wishlist.findMany({ where: { userId: "user-test-2" }});
    expect(user2Items.length).toBe(1);
  });

  it("5. Invalid product handling (missing productId)", async () => {
    const req = new NextRequest("http://localhost/api/user/wishlist", {
      method: "POST",
      body: JSON.stringify({})
    });

    const res = await POST(req as any, {} as any);
    expect(res.status).toBe(400); // Because userService throws 400 for missing productId
  });

  it("6. Unauthorized request", async () => {
    const { getServerSession } = await import("next-auth");
    vi.mocked(getServerSession).mockResolvedValueOnce(null as any); // Mock unauthenticated

    const req = createReq("prod-1");
    const res = await POST(req as any, {} as any);
    
    expect(res.status).toBe(401);
  });
});
