import { describe, it, expect, beforeEach, afterEach } from "vitest";
import prisma from "@/lib/prisma";
import { AuthService } from "@/services/auth.service";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { OrderStatus } from "@prisma/client";

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
      const res1 = await AuthService.registerUser(payload1);
      expect(res1.message).toBe("If the email is valid, a verification link has been sent.");

      // Mark first user as verified
      await prisma.user.update({ where: { email: "enum@test.com" }, data: { emailVerified: new Date() } });

      const payload2 = { name: "Test 2", email: "enum@test.com", password: "password123" };
      const res2 = await AuthService.registerUser(payload2);
      expect(res2.message).toBe("If the email is valid, a verification link has been sent.");
    });
  });

  describe("2. Verification Token Lifecycle", () => {
    it("verifies user and deletes token atomically", async () => {
      await AuthService.registerUser({ name: "Verify", email: "verify@test.com", password: "password123" });
      const tokenRecord = await prisma.verificationToken.findFirst({ where: { identifier: "verify@test.com" } });
      expect(tokenRecord).not.toBeNull();

      const verifyRes = await AuthService.verifyEmail(tokenRecord!.token);
      expect(verifyRes.message).toBe("Email verified successfully");

      const user = await prisma.user.findUnique({ where: { email: "verify@test.com" } });
      expect(user?.emailVerified).not.toBeNull();

      const deletedToken = await prisma.verificationToken.findFirst({ where: { identifier: "verify@test.com" } });
      expect(deletedToken).toBeNull();
    });

    it("rejects expired tokens", async () => {
      await AuthService.registerUser({ name: "Verify Exp", email: "verify_exp@test.com", password: "password123" });
      const tokenRecord = await prisma.verificationToken.findFirst({ where: { identifier: "verify_exp@test.com" } });
      
      // Manually expire token
      await prisma.verificationToken.update({
        where: { token: tokenRecord!.token },
        data: { expires: new Date(Date.now() - 1000) }
      });

      await expect(AuthService.verifyEmail(tokenRecord!.token)).rejects.toThrow("Invalid or expired token");
    });
  });

  describe("3. Credential Login Enforcement", () => {
    it("rejects unverified login", async () => {
      await AuthService.registerUser({ name: "Login Unverified", email: "login_u@test.com", password: "password123" });
      
      const credentialsProvider = authOptions.providers.find(p => p.id === "credentials") as any;
      await expect(credentialsProvider.options.authorize({ email: "login_u@test.com", password: "password123" }, null)).rejects.toThrow("EMAIL_NOT_VERIFIED");
    });

    it("allows verified login", async () => {
      await AuthService.registerUser({ name: "Login Verified", email: "login_v@test.com", password: "password123" });
      const tokenRecord = await prisma.verificationToken.findFirst({ where: { identifier: "login_v@test.com" } });
      await AuthService.verifyEmail(tokenRecord!.token);

      const credentialsProvider = authOptions.providers.find(p => p.id === "credentials") as any;
      const user = await credentialsProvider.options.authorize({ email: "login_v@test.com", password: "password123" }, null);
      expect(user.email).toBe("login_v@test.com");
    });
  });

  describe("4. OAuth Unverified Account Replacement Policy", () => {
    it("safely replaces unverified credential account on OAuth sign in", async () => {
      // 1. Attacker registers an unverified account
      await AuthService.registerUser({ name: "Victim", email: "victim@test.com", password: "attacker_password" });
      
      const unverifiedUser = await prisma.user.findUnique({ where: { email: "victim@test.com" } });
      expect(unverifiedUser?.emailVerified).toBeNull();
      
      // 2. Victim logs in via Google OAuth
      const signInCallback = authOptions.callbacks?.signIn as any;
      const result = await signInCallback({
        user: { email: "victim@test.com" },
        account: { provider: "google" }
      });
      expect(result).toBe(true);

      // The unverified user should be deleted
      const deletedUser = await prisma.user.findUnique({ where: { email: "victim@test.com" } });
      expect(deletedUser).toBeNull();
    });

    it("DOES NOT replace verified accounts", async () => {
      // 1. Victim registers and verifies
      await AuthService.registerUser({ name: "Victim", email: "victim2@test.com", password: "victim_password" });
      const token = await prisma.verificationToken.findFirst({ where: { identifier: "victim2@test.com" } });
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
      await AuthService.registerUser({ name: "Victim", email: "victim3@test.com", password: "victim_password" });
      const existingUser = await prisma.user.findUnique({ where: { email: "victim3@test.com" } });
      
      // Manually add an order (simulate guest checkout linking)
      await prisma.order.create({
        data: {
          id: "order_test_1",
          orderNumber: "ORD-123",
          userId: existingUser!.id,
          subtotal: 1000,
          shippingCost: 100,
          total: 1100,
          balanceDue: 1100,
          status: OrderStatus.PENDING,
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
