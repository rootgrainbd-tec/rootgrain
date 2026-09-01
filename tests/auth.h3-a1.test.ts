import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import prisma from "@/lib/prisma";
import { AuthService } from "@/services/auth.service";
import { authOptions } from "@/lib/auth";
import { OrderStatus } from "@prisma/client";

// Mock external email boundary to ensure deterministic isolation and prevent SMTP timeouts
vi.mock("@/lib/email", () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue(true),
  sendLoginAttemptEmail: vi.fn().mockResolvedValue(true),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(true),
  sendOrderConfirmationEmail: vi.fn().mockResolvedValue(true),
  sendOrderStatusUpdateEmail: vi.fn().mockResolvedValue(true),
  sendAbandonedCartEmail: vi.fn().mockResolvedValue(true),
}));

describe("SECURITY-H3-A1: Identity Hardening & Pre-ATO Prevention", () => {
  beforeEach(async () => {
    await prisma.session.deleteMany();
    await prisma.account.deleteMany();
    await prisma.user.deleteMany();
    await prisma.verificationToken.deleteMany();
  });

  afterEach(async () => {
    await prisma.session.deleteMany();
    await prisma.account.deleteMany();
    await prisma.user.deleteMany();
    await prisma.verificationToken.deleteMany();
  });

  describe("1. Registration & Enumeration", () => {
    it("returns identical response for new and existing email", async () => {
      const payload1 = { name: "Test 1", email: "enum@test.com", password: "password123" };
      const res1 = await AuthService.register(payload1);
      expect(res1.email).toBe("enum@test.com");

      // Mark first user as verified
      await prisma.user.update({ where: { email: "enum@test.com" }, data: { emailVerified: new Date() } });

      const payload2 = { name: "Test 2", email: "enum@test.com", password: "password123" };
      await expect(AuthService.register(payload2)).rejects.toThrow("Registration failed");
    });
  });

  describe("2. Verification Token Lifecycle", () => {
    it("verifies user and deletes token atomically", async () => {
      await AuthService.register({ name: "Verify", email: "verify@test.com", password: "password123" });
      const user = await prisma.user.findUnique({ where: { email: "verify@test.com" } });
      const tokenRecord = await prisma.verificationToken.findFirst({ where: { identifier: user!.email } });
      expect(tokenRecord).not.toBeNull();

      await AuthService.verifyEmail(tokenRecord!.token);

      const verifiedUser = await prisma.user.findUnique({ where: { email: "verify@test.com" } });
      expect(verifiedUser?.emailVerified).not.toBeNull();

      const deletedToken = await prisma.verificationToken.findFirst({ where: { identifier: user!.email } });
      expect(deletedToken).toBeNull();
    });

    it("rejects expired tokens", async () => {
      await AuthService.register({ name: "Verify Exp", email: "verify_exp@test.com", password: "password123" });
      const user = await prisma.user.findUnique({ where: { email: "verify_exp@test.com" } });
      const tokenRecord = await prisma.verificationToken.findFirst({ where: { identifier: user!.email } });
      
      // Manually expire token
      await prisma.verificationToken.update({
        where: { identifier_token: { identifier: tokenRecord!.identifier, token: tokenRecord!.token } },
        data: { expires: new Date(Date.now() - 1000) }
      });

      await expect(AuthService.verifyEmail(tokenRecord!.token)).rejects.toThrow("Invalid or expired token");
    });
  });

  describe("3. Credential Login Enforcement", () => {
    it("rejects unverified login", async () => {
      await AuthService.register({ name: "Login Unverified", email: "login_u@test.com", password: "password123" });
      
      const credentialsProvider = authOptions.providers.find(p => p.id === "credentials") as any;
      await expect(credentialsProvider.options.authorize({ email: "login_u@test.com", password: "password123" }, null)).rejects.toThrow("EMAIL_NOT_VERIFIED");
    });

    it("allows verified login", async () => {
      await AuthService.register({ name: "Login Verified", email: "login_v@test.com", password: "password123" });
      const userCreate = await prisma.user.findUnique({ where: { email: "login_v@test.com" } });
      const tokenRecord = await prisma.verificationToken.findFirst({ where: { identifier: userCreate!.email } });
      await AuthService.verifyEmail(tokenRecord!.token);

      const credentialsProvider = authOptions.providers.find(p => p.id === "credentials") as any;
      const user = await credentialsProvider.options.authorize({ email: "login_v@test.com", password: "password123" }, null);
      expect(user.email).toBe("login_v@test.com");
    });
  });

  describe("4. OAuth Account Preservation Policy", () => {
    it("safely preserves unverified credential account on OAuth sign in without deletion", async () => {
      // 1. User registers an unverified account
      await AuthService.register({ name: "Victim", email: "victim@test.com", password: "attacker_password" });
      
      const unverifiedUser = await prisma.user.findUnique({ where: { email: "victim@test.com" } });
      expect(unverifiedUser?.emailVerified).toBeNull();
      
      // 2. User logs in via Google OAuth
      const signInCallback = authOptions.callbacks?.signIn as any;
      const result = await signInCallback({
        user: { email: "victim@test.com" },
        account: { provider: "google" }
      });
      expect(result).toBe(true);

      // Invariant: The unverified user MUST NOT be deleted
      const preservedUser = await prisma.user.findUnique({ where: { email: "victim@test.com" } });
      expect(preservedUser).not.toBeNull();
      expect(preservedUser?.id).toBe(unverifiedUser?.id);
    });

    it("DOES NOT replace verified accounts", async () => {
      // 1. Victim registers and verifies
      await AuthService.register({ name: "Victim", email: "victim2@test.com", password: "victim_password" });
      const userCreate = await prisma.user.findUnique({ where: { email: "victim2@test.com" } });
      const token = await prisma.verificationToken.findFirst({ where: { identifier: userCreate!.email } });
      await AuthService.verifyEmail(token!.token);
      
      // 2. Someone tries to OAuth
      const signInCallback = authOptions.callbacks?.signIn as any;
      await signInCallback({
        user: { email: "victim2@test.com" },
        account: { provider: "google" }
      });

      // The verified user MUST NOT be deleted
      const existingUser = await prisma.user.findUnique({ where: { email: "victim2@test.com" } });
      expect(existingUser).not.toBeNull();
    });

    it("DOES NOT replace unverified accounts with business data", async () => {
      await AuthService.register({ name: "Victim", email: "victim3@test.com", password: "victim_password" });
      const existingUser = await prisma.user.findUnique({ where: { email: "victim3@test.com" } });
      
      // Manually add an order (simulate guest checkout linking)
      const testOrderId = "order_" + Math.random().toString(36).substring(7);
      await prisma.order.create({
        data: {
          id: testOrderId,
          orderNumber: "ORD-" + testOrderId,
          userId: existingUser!.id,
          subtotal: 1000,
          shippingCost: 100,
          total: 1100,
          balanceDue: 1100,
          status: OrderStatus.PENDING_ADVANCE,
          items: {},
          shippingAddress: { name: "Test", phone: "123", division: "Test", district: "Test", street: "Test" }
        }
      });

      const signInCallback = authOptions.callbacks?.signIn as any;
      await signInCallback({
        user: { email: "victim3@test.com" },
        account: { provider: "google" }
      });

      // The user MUST NOT be deleted due to associated business data
      const preservedUser = await prisma.user.findUnique({ where: { email: "victim3@test.com" } });
      expect(preservedUser).not.toBeNull();
    });
  });
});
