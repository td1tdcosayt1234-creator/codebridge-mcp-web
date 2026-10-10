// elsemail.indevs.in — self-hosted verify email service (OTP kit).
// Server-side only: NEVER import from client components (API key).
import dns from "node:dns";
// This RDP's egress hangs on Cloudflare IPv6: prefer IPv4 everywhere.
try { dns.setDefaultResultOrder("ipv4first"); } catch { /* ignore */ }

// Single origin ONLY. elsemail stores OTPs per-instance: a fallback host
// would save/verify against a DIFFERENT store and burn valid codes.
const BASE = (process.env.ELSEMAIL_URL || "https://elsemail.indevs.in").replace(/\/+$/, "");
const KEY = process.env.ELSEMAIL_API_KEY || "";

export function elsemailConfigured(): boolean {
  return KEY !== "";
}

async function call(path: string, body: unknown, timeoutMs: number): Promise<{ ok: boolean; error?: string }> {
  if (!elsemailConfigured()) return { ok: false, error: "Email service not configured (ELSEMAIL_API_KEY)." };
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(BASE + path, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": KEY },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const j = await r.json().catch(() => ({}));
    // Pass the service's exact reason through (not found / expired /
    // mismatch / attempts) so the UI can tell the user what to do.
    if (!r.ok) return { ok: false, error: String(j.error || j.reason || "Email service error (" + r.status + ")") };
    return { ok: true };
  } catch {
    return { ok: false, error: "Email service slow — your code may still arrive. Press Resend once." };
  } finally {
    clearTimeout(t);
  }
}

export function sendSignupOtp(email: string) {
  // Real SMTP delivery can take 10-40s; elsemail saves the OTP BEFORE
  // sending, so even a slow mail still verifies — never abort too early,
  // and NEVER double-send (each send invalidates the previous code).
  return call("/api/auth/send-otp", { email }, 45000);
}

export function checkSignupOtp(email: string, code: string) {
  return call("/api/auth/verify-otp", { email, code }, 15000);
}

// Generic branded mail through elsemail (used for our own reset link so
// users get ONE mail pointing at our domain — no foreign links).
export function sendBrandedMail(to: string, subject: string, html: string) {
  return call("/api/mail/send", { to, subject, html }, 45000);
}
