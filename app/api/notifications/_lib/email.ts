/**
 * Email delivery helper.
 *
 * Uses Resend (https://resend.com) when RESEND_API_KEY is set.
 * Falls back to console logging for local development.
 *
 * Install: yarn add resend
 */

import { logger } from "@/app/utils/logger";

const log = logger.child("email");

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const { to, subject, html } = options;
  const from = process.env.EMAIL_FROM ?? "Stellar Wrapped <noreply@stellarwrapped.app>";

  if (!process.env.RESEND_API_KEY) {
    // Local dev fallback — log at debug level only
    log.debug("Would send email:", { to, subject });
    return;
  }

  try {
    const mod = await Function("m", "return import(m)")("resend");
    if (mod?.Resend) {
      const resend = new mod.Resend(process.env.RESEND_API_KEY);
      const { error } = await resend.emails.send({ from, to, subject, html });
      if (error) {
        throw new Error(`Email send failed: ${error.message}`);
      }
    }
  } catch (err) {
    console.warn("[email] Resend delivery skipped or failed:", err);
  }
}
