import { DefaultSession, NextAuthOptions } from "next-auth";
import { logger } from "./logger";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";

import type { Adapter } from "next-auth/adapters";
import { Role } from "@prisma/client";
import { sendWelcomeEmail } from "@/lib/email";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days explicit
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      allowDangerousEmailAccountLinking: false,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID as string,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET as string,
      allowDangerousEmailAccountLinking: false,
    }),
    EmailProvider({
      server: process.env.EMAIL_SERVER as string,
      from: process.env.EMAIL_FROM as string,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const ip = req?.headers?.["x-forwarded-for"] || "unknown";
        const userAgent = req?.headers?.["user-agent"] || "unknown";

        const { AuthService } = await import("@/services/auth.service");
        const result = await AuthService.login(
          credentials.email,
          credentials.password,
          ip,
          userAgent
        );

        if (!result.success || !result.user) {
          throw new Error(result.error || "Invalid credentials");
        }

        // Check if email is verified. AuthService.login doesn't explicitly throw for this if we rely on it here, 
        // but we can check the returned user just in case.
        if (!result.user.emailVerified) {
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        return result.user;
      }
    })
  ],
  events: {
    async createUser({ user }) {
      if (user.email) {
        try {
          await sendWelcomeEmail(user);
        } catch (e) {
          logger.error({ err: e, email: user.email }, "Failed to send welcome email on OAuth signup");
        }

        try {
          await prisma.$executeRaw`
            UPDATE "Order"
            SET "userId" = ${user.id}
            WHERE "userId" IS NULL 
            AND "shippingAddress"->>'email' = ${user.email}
          `;
          logger.info({ email: user.email }, "Linked guest orders via OAuth");
        } catch (e) {
          console.error("Failed to link guest orders on OAuth:", e);
        }
      }
    }
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account && account.provider !== "credentials" && user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: {
            accounts: true,
            orders: true,
            addresses: true,
            reviews: true
          }
        });

        if (
          existingUser &&
          existingUser.emailVerified === null &&
          existingUser.accounts.length === 0 &&
          existingUser.orders.length === 0 &&
          existingUser.addresses.length === 0 &&
          existingUser.reviews.length === 0 &&
          existingUser.passwordHash !== null
        ) {
          // Unverified credential account blocking OAuth flow. Safe to replace.
          try {
            await prisma.$transaction([
              prisma.session.deleteMany({ where: { userId: existingUser.id } }),
              prisma.user.delete({ where: { id: existingUser.id } })
            ]);
            logger.info({ email: user.email }, "Safely replaced unverified credential account during OAuth sign-in");
          } catch (error) {
            logger.error({ err: error, email: user.email }, "Failed to replace unverified account");
          }
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        (session.user as any).role = token.role as Role;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = (user as any).role || Role.USER;
      }
      return token;
    }
  }
};
