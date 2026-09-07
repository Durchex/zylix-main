import "server-only";
import { getEnv } from "@/server/config/env";

/**
 * Minimal dev-mode email sender. No real provider (Resend/SendGrid/SES) is
 * wired yet — swap the implementation of `send` when one is chosen; every
 * caller in this codebase already goes through this single choke point.
 */
export const emailService = {
  async send(to: string, subject: string, body: string): Promise<void> {
    console.info("[email] dispatched (dev mode — not actually sent)", { to, subject, body });
  },

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const link = `${getEnv().APP_URL}/auth/verify-email/${token}`;
    await this.send(to, "Verify your ZylixStore account", `Verify your email: ${link}`);
  },

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const link = `${getEnv().APP_URL}/auth/reset-password/${token}`;
    await this.send(to, "Reset your ZylixStore password", `Reset your password: ${link}`);
  },
};
