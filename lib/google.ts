import crypto from "crypto";

// Google OAuth (Sign in with Google). ALL secrets come from process.env only —
// never hardcode client id/secret in JS/TS files.
//
// Required env:
//   GOOGLE_CLIENT_ID=....apps.googleusercontent.com
//   GOOGLE_CLIENT_SECRET=GOCSPX-...
// Optional:
//   GOOGLE_REDIRECT_URI=https://your-host/api/auth/google/callback
//   (omit to auto-derive from the request Host — works on localhost + tunnel
//   but the derived URL must be whitelisted in Google Cloud Console.)

export function googleConfigured(): boolean {
  const id = process.env.GOOGLE_CLIENT_ID || "";
  const sec = process.env.GOOGLE_CLIENT_SECRET || "";
  return id.endsWith(".apps.googleusercontent.com") && sec.length >= 10;
}

export function googleRedirectUri(req: Request): string {
  const fixed = (process.env.GOOGLE_REDIRECT_URI || "").trim();
  if (fixed) return fixed.replace(/\/$/, "");
  const proto = (req.headers.get("x-forwarded-proto") || "").split(",")[0].trim() || "http";
  const fwdHost = (req.headers.get("x-forwarded-host") || "").split(",")[0].trim();
  const host =
    (process.env.TRUST_PROXY === "true" && fwdHost) ||
    (req.headers.get("host") || "").split(",")[0].trim() ||
    new URL(req.url).host;
  return proto + "://" + host + "/api/auth/google/callback";
}

export function googleAuthUrl(state: string, redirectUri: string): string {
  const id = process.env.GOOGLE_CLIENT_ID || "";
  const q = new URLSearchParams({
    client_id: id,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    prompt: "select_account",
    state,
  });
  return "https://accounts.google.com/o/oauth2/v2/auth?" + q.toString();
}

export async function googleExchangeCode(code: string, redirectUri: string): Promise<{ accessToken: string }> {
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }).toString(),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) throw new Error("Google code exchange failed.");
  return { accessToken: String(j.access_token) };
}

export async function googleFetchProfile(accessToken: string): Promise<{ sub: string; email: string; verified: boolean; name: string }> {
  const r = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: "Bearer " + accessToken },
  });
  const j = await r.json().catch(() => ({}));
  const email = String(j.email || "").trim().toLowerCase();
  if (!r.ok || !email || !j.sub) throw new Error("Google profile fetch failed.");
  return { sub: String(j.sub), email, verified: j.email_verified === true, name: String(j.name || "").slice(0, 120) };
}

export function newState(): string {
  return crypto.randomBytes(24).toString("hex");
}

export function safeNext(v: unknown, fallback = "/dashboard"): string {
  const s = String(v || "");
  if (s.startsWith("/") && !s.startsWith("//")) return s.slice(0, 300);
  return fallback;
}
