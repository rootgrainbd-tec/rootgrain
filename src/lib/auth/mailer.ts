export interface MailerService {
  sendVerificationEmail(email: string, token: string): Promise<void>;
  sendPasswordResetEmail(email: string, token: string): Promise<void>;
}

// A stub mailer implementation. In a real application, this would
// integrate with SendGrid, Resend, or AWS SES.
export const mailer: MailerService = {
  async sendVerificationEmail(email: string, token: string) {
    // Determine the base URL dynamically based on environment
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'https://rootgrain.bd';
    const link = `${baseUrl}/verify-email?token=${token}`;
    
    console.log(`\n[MAILER MOCK] ----------------------------------------------------`);
    console.log(`[MAILER MOCK] Sending Verification Email to: ${email}`);
    console.log(`[MAILER MOCK] Link: ${link}`);
    console.log(`[MAILER MOCK] ----------------------------------------------------\n`);
  },

  async sendPasswordResetEmail(email: string, token: string) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'https://rootgrain.bd';
    const link = `${baseUrl}/reset-password?token=${token}`;

    console.log(`\n[MAILER MOCK] ----------------------------------------------------`);
    console.log(`[MAILER MOCK] Sending Password Reset Email to: ${email}`);
    console.log(`[MAILER MOCK] Link: ${link}`);
    console.log(`[MAILER MOCK] ----------------------------------------------------\n`);
  }
};
