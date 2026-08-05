import prisma from '@/lib/prisma';
import { logAuthEvent, AuthProvider, LoginFailureReason } from '@/lib/auth/audit';
import { SessionService } from '@/services/session.service';

export interface GoogleProfile {
  id: string; // Google subject ID
  email: string;
  name: string;
  picture?: string;
  email_verified: boolean;
}

export class OAuthService {
  /**
   * Processes a successful Google OAuth login.
   * If the user already has an account, it checks linking policies and logs them in.
   * If the user is new, it signals that onboarding is required.
   */
  static async processGoogleLogin(profile: GoogleProfile, ipAddress: string, userAgent: string) {
    // 1. Check if an account already exists with this email
    const user = await prisma.user.findUnique({
      where: { email: profile.email },
      include: { accounts: true },
    });

    if (user) {
      // User exists. Do they have a Google account linked?
      const googleAccount = user.accounts.find(a => a.provider === AuthProvider.GOOGLE);

      if (!googleAccount) {
        // Option B: Do NOT automatically link Google accounts.
        logAuthEvent({ userId: user.id, email: profile.email, ipAddress, userAgent, authMethod: AuthProvider.GOOGLE, success: false, failureReason: LoginFailureReason.OAUTH_REJECTED });
        return { 
          success: false, 
          error: 'An account with this email already exists. Please log in with your password and link your Google account in Settings.',
          requiresOnboarding: false
        };
      }

      // Check Lockout
      // @ts-ignore
      if (user.lockedUntil && new Date() < user.lockedUntil) {
        logAuthEvent({ userId: user.id, email: profile.email, ipAddress, userAgent, authMethod: AuthProvider.GOOGLE, success: false, failureReason: LoginFailureReason.ACCOUNT_LOCKED });
        return { success: false, error: 'Account locked. Please try again later.', requiresOnboarding: false };
      }

      // Success! Generate session
      const sessionToken = await SessionService.createSession(user.id, true);
      logAuthEvent({ userId: user.id, email: profile.email, ipAddress, userAgent, authMethod: AuthProvider.GOOGLE, success: true });

      return { success: true, token: sessionToken, user, requiresOnboarding: false };
    } else {
      // User does not exist. We require an onboarding step.
      // We will generate a temporary signed token (or store in a temporary session cache)
      // For now, we return the profile data so the frontend can redirect to the onboarding page.
      
      logAuthEvent({ email: profile.email, ipAddress, userAgent, authMethod: AuthProvider.GOOGLE, success: true }); // Successful auth, pending registration

      return { 
        success: true, 
        requiresOnboarding: true,
        onboardingData: {
          email: profile.email,
          name: profile.name,
          providerAccountId: profile.id
        }
      };
    }
  }

  /**
   * Completes the Google onboarding process by creating the user account.
   */
  static async completeGoogleOnboarding(data: { email: string; name: string; providerAccountId: string; phone?: string; ipAddress: string; userAgent: string }) {
    // Note: The caller must cryptographically verify the email/providerAccountId (e.g. via a signed JWT) 
    // before calling this, to prevent forging.

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new Error('Email already registered');
    }

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        emailVerified: true, // Google emails are pre-verified
        updatedAt: new Date(),
      },
    });

    await prisma.account.create({
      data: {
        userId: user.id,
        provider: AuthProvider.GOOGLE,
        providerAccountId: data.providerAccountId,
        updatedAt: new Date(),
      },
    });

    const sessionToken = await SessionService.createSession(user.id, true);
    logAuthEvent({ userId: user.id, email: data.email, ipAddress: data.ipAddress, userAgent: data.userAgent, authMethod: AuthProvider.GOOGLE, success: true });

    return { success: true, token: sessionToken, user };
  }
}
