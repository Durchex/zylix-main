import { logger } from "@/lib/logger";

/**
 * Minimal dev-mode email sender. No real provider (Resend/SendGrid/SES) is
 * wired yet — swap the implementation of `send` when one is chosen; every
 * caller in this codebase already goes through this single choke point.
 */
export const emailService = {
  async send(to: string, subject: string, body: string): Promise<void> {
    logger.info("Email dispatched (dev mode — not actually sent)", { to, subject, body });
  },

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const link = `${process.env.APP_URL ?? "http://localhost:3000"}/auth/verify-email/${token}`;
    await this.send(to, "Verify your Zylix account", `Verify your email: ${link}`);
  },

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const link = `${process.env.APP_URL ?? "http://localhost:3000"}/auth/reset-password/${token}`;
    await this.send(to, "Reset your Zylix password", `Reset your password: ${link}`);
  },
};
