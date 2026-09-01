import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import prisma from "@/lib/prisma";
import { AuthService } from "@/services/auth.service";
import { authOptions } from "@/lib/auth";
import { OrderStatus, Role } from "@prisma/client";

// Mock external email to ensure isolation
vi.mock("@/lib/email", () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue(true),
  sendLoginAttemptEmail: vi.fn().mockResolvedValue(true),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(true),
  sendOrderConfirmationEmail: vi.fn().mockResolvedValue(true),
  sendOrderStatusUpdateEmail: vi.fn().mockResolvedValue(true),
  sendAbandonedCartEmail: vi.fn().mockResolvedValue(true),
  sendWelcomeEmail: vi.fn().mockResolvedValue(true),
}));

const TEST_EMAILS = [
  "unverified@test.com",
  "admin@test.com",
  "customer@test.com",
  "repeat@test.com",
  "creds@test.com",
  "googleuser@test.com",
];

async function cleanupTestData() {
  const users = await prisma.user.findMany({
    where: { email: { in: TEST_EMAILS } },
    select: { id: true },
  });
  const userIds = users.map((u) => u.id);

  if (userIds.length > 0) {
    const orders = await prisma.order.findMany({
      where: { userId: { in: userIds } },
      select: { id: true },
    });
    const orderIds = orders.map((o) => o.id);

    if (orderIds.length > 0) {
      await prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
      await prisma.paymentRecord.deleteMany({ where: { orderId: { in: orderIds } } });
      await prisma.orderEvent.deleteMany({ where: { orderId: { in: orderIds } } });
      await prisma.notificationOutbox.deleteMany({ where: { orderId: { in: orderIds } } });
      await prisma.adminInternalNote.deleteMany({ where: { orderId: { in: orderIds } } });
      await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
    }

    await prisma.session.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.account.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  }

  await prisma.verificationToken.deleteMany({ where: { identifier: { in: TEST_EMAILS } } });
}

describe("GATE 1: Authentication Destructive-Deletion Safety Verification", () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  it("TEST 1: Existing unverified user + OAuth login -> User is NOT deleted", async () => {
    // Register unverified user
    await AuthService.register({
      name: "Unverified User",
      email: "unverified@test.com",
      password: "secure_password_123",
    });

    const userBefore = await prisma.user.findUnique({ where: { email: "unverified@test.com" } });
    expect(userBefore).not.toBeNull();
    expect(userBefore?.emailVerified).toBeNull();

    // Trigger OAuth signIn callback
    const signInCallback = authOptions.callbacks?.signIn as any;
    const result = await signInCallback({
      user: { email: "unverified@test.com" },
      account: { provider: "google" },
    });
    expect(result).toBe(true);

    // Invariant Check: User must still exist with exact same ID
    const userAfter = await prisma.user.findUnique({ where: { email: "unverified@test.com" } });
    expect(userAfter).not.toBeNull();
    expect(userAfter?.id).toBe(userBefore?.id);
    expect(userAfter?.passwordHash).toBe(userBefore?.passwordHash);
  });

  it("TEST 2: Existing admin user + OAuth login -> User is NOT deleted and role is preserved", async () => {
    // Create an Admin user
    const adminUser = await prisma.user.create({
      data: {
        name: "Admin User",
        email: "admin@test.com",
        role: Role.ADMIN,
        emailVerified: null, // Even if unverified, must not be deleted
      },
    });

    const signInCallback = authOptions.callbacks?.signIn as any;
    const result = await signInCallback({
      user: { email: "admin@test.com" },
      account: { provider: "google" },
    });
    expect(result).toBe(true);

    // Invariant Check: Admin User must still exist with ADMIN role
    const adminAfter = await prisma.user.findUnique({ where: { email: "admin@test.com" } });
    expect(adminAfter).not.toBeNull();
    expect(adminAfter?.id).toBe(adminUser.id);
    expect(adminAfter?.role).toBe(Role.ADMIN);
  });

  it("TEST 3: Existing user with orders + OAuth login -> User is NOT deleted and orders preserved", async () => {
    const user = await prisma.user.create({
      data: {
        name: "Customer With Orders",
        email: "customer@test.com",
        role: Role.USER,
      },
    });

    const orderId = "order_test_123";
    await prisma.order.create({
      data: {
        id: orderId,
        orderNumber: "ORD-TEST-123",
        userId: user.id,
        subtotal: 5000,
        shippingCost: 100,
        total: 5100,
        balanceDue: 5100,
        status: OrderStatus.PENDING_ADVANCE,
        items: {},
        shippingAddress: { name: "Customer", phone: "01700000000", division: "Dhaka", district: "Dhaka", street: "Test Road" },
      },
    });

    const signInCallback = authOptions.callbacks?.signIn as any;
    const result = await signInCallback({
      user: { email: "customer@test.com" },
      account: { provider: "google" },
    });
    expect(result).toBe(true);

    const userAfter = await prisma.user.findUnique({
      where: { email: "customer@test.com" },
      include: { orders: true },
    });
    expect(userAfter).not.toBeNull();
    expect(userAfter?.orders.length).toBe(1);
    expect(userAfter?.orders[0].id).toBe(orderId);
  });

  it("TEST 4: OAuth conflict / repeat login -> safe handling", async () => {
    const user = await prisma.user.create({
      data: {
        name: "Repeat User",
        email: "repeat@test.com",
        role: Role.USER,
      },
    });

    const signInCallback = authOptions.callbacks?.signIn as any;
    
    // First OAuth sign-in
    const res1 = await signInCallback({
      user: { email: "repeat@test.com" },
      account: { provider: "google" },
    });
    expect(res1).toBe(true);

    // Second OAuth sign-in
    const res2 = await signInCallback({
      user: { email: "repeat@test.com" },
      account: { provider: "google" },
    });
    expect(res2).toBe(true);

    const userAfter = await prisma.user.findUnique({ where: { email: "repeat@test.com" } });
    expect(userAfter?.id).toBe(user.id);
  });

  it("TEST 5: Normal credentials login behavior unchanged", async () => {
    await AuthService.register({
      name: "Creds User",
      email: "creds@test.com",
      password: "password123",
    });

    // Unverified rejects
    const credentialsProvider = authOptions.providers.find((p) => p.id === "credentials") as any;
    await expect(
      credentialsProvider.options.authorize({ email: "creds@test.com", password: "password123" }, null)
    ).rejects.toThrow("EMAIL_NOT_VERIFIED");

    // Verify user
    const token = await prisma.verificationToken.findFirst({ where: { identifier: "creds@test.com" } });
    await AuthService.verifyEmail(token!.token);

    // Verified succeeds
    const authedUser = await credentialsProvider.options.authorize(
      { email: "creds@test.com", password: "password123" },
      null
    );
    expect(authedUser.email).toBe("creds@test.com");
  });

  it("TEST 6: Normal Google OAuth code path remains intact", async () => {
    const googleProvider = authOptions.providers.find((p) => p.id === "google") as any;
    expect(googleProvider).toBeDefined();
    expect(googleProvider.options.allowDangerousEmailAccountLinking).toBe(true);

    // Verify profile mapping
    const profile = {
      sub: "google_sub_12345",
      name: "Google Name",
      email: "googleuser@test.com",
      picture: "https://lh3.googleusercontent.com/avatar",
      email_verified: true,
    };
    const mapped = googleProvider.options.profile(profile);
    expect(mapped.id).toBe("google_sub_12345");
    expect(mapped.email).toBe("googleuser@test.com");
    expect(mapped.name).toBe("Google Name");
    expect(mapped.emailVerified).toBeInstanceOf(Date);
  });
});
