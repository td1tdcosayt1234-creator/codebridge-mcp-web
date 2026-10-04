import { createHash, randomBytes } from "crypto";

// Notion-style OAuth for the MCP server (MCP spec 2025-06-18, RFC 8707/7591/7636).
// Lets AI clients (Cursor / Claude / ChatGPT / opencode) connect with a
// one-click browser login instead of hand-copying a personal key:
//
//   MCP client -> 401 + resource_metadata -> DCR /api/oauth/register
//     -> browser /api/oauth/authorize (login + Approve)
//     -> /api/oauth/token (code + PKCE verifier) -> access_token
//
// The access_token IS the user's personal MCP key (cb_...), so the existing
// Bearer check in /api/mcp keeps working unchanged. Clients + codes persist
// in db.json (shared across routes); codes expire after 10 min.

const CODE_TTL_MS = 10 * 60 * 1000;

function base(req: Request): string {
  const proto = (req.headers.get("x-forwarded-proto") || "").split(",")[0].trim() || "http";
  // x-forwarded-host is client-controlled — trust only behind sanitising proxy.
  const fwdHost = (req.headers.get("x-forwarded-host") || "").split(",")[0].trim();
  const host =
    ((process.env.TRUST_PROXY === "true" && fwdHost) ||
      (req.headers.get("host") || "").split(",")[0].trim());
  if (host) return proto + "://" + host;
  return new URL(req.url).origin;
}

export function mcpResourceUrl(req: Request): string {
  return base(req) + "/api/mcp";
}

export function resourceMetadata(req: Request) {
  const resource = mcpResourceUrl(req);
  return {
    resource,
    authorization_servers: [base(req)],
    scopes_supported: ["mcp"],
    bearer_methods_supported: ["header"],
    resource_documentation: base(req) + "/mcp",
  };
}

export function authServerMetadata(req: Request) {
  const b = base(req);
  return {
    issuer: b,
    authorization_endpoint: b + "/api/oauth/authorize",
    token_endpoint: b + "/api/oauth/token",
    registration_endpoint: b + "/api/oauth/register",
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
  };
}

// 401 with a machine-readable body (Notion-style). Clients that sent a wrong
// key used to get a 200 approval text they could not parse ("invalid auth
// json") — now they get a real invalid_token error.
export function invalidToken(detail: string) {
  return Response.json(
    { error: "invalid_token", error_description: detail },
    {
      status: 401,
      headers: {
        "WWW-Authenticate":
          'Bearer error="invalid_token", error_description="' + detail.replace(/"/g, "") + '"',
      },
    }
  );
}

export function unauthorizedNoAuth(req: Request) {
  const rm = base(req) + "/.well-known/oauth-protected-resource";
  return Response.json(
    {
      error: "unauthorized",
      error_description:
        "Login required (one time). Open " + base(req) + "/mcp to connect, or pass Authorization: Bearer <key> from /dashboard/mcp.",
    },
    {
      status: 401,
      headers: { "WWW-Authenticate": 'Bearer resource_metadata="' + rm + '"' },
    }
  );
}

// ---- redirect policy (open-redirect / code-exfil guard) ----
// Codes are bearer credentials for 10 min: the callback must never go to
// an attacker host. Allow loopback http (MCP clients listen on ephemeral
// localhost ports) and any https. Plain-http remote + custom schemes are
// rejected — fail closed with an error page, never a redirect.
export function redirectUriOk(uri: string): boolean {
  let u: URL;
  try {
    u = new URL(uri);
  } catch {
    return false;
  }
  const host = u.hostname.toLowerCase();
  const loopback = host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host === "::1";
  if (u.protocol === "https:") return true;
  if (u.protocol === "http:" && loopback) return true;
  return false;
}
// Remote (non-loopback) callbacks must use PKCE S256: without it a stolen
// code + exact redirect_uri is enough to trade for the victim's MCP key.
export function needsPkce(uri: string): boolean {
  try {
    const host = new URL(uri).hostname.toLowerCase();
    return !(host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host === "::1");
  } catch {
    return true;
  }
}
// ---- DCR store (persisted in db.json — Next.js route bundles do NOT share
// module-level memory, so in-process Maps lose codes between /authorize and
// /token) ----
export async function saveClient(clientId: string, redirectUris: string[]) {
  const { readDb, writeDb } = await import("./db");
  const db = await readDb();
  // Validate + cap: max 10 callbacks per client, each must pass the
  // loopback-https policy — a poisoned DCR record must never persist.
  const clean = Array.from(new Set(redirectUris)).filter((u) => redirectUriOk(u)).slice(0, 10);
  if (!clean.length) return;
  const hit = db.oauthClients.find((c) => c.id === clientId);
  if (hit) hit.redirectUris = clean;
  else {
    if (db.oauthClients.length >= 500) db.oauthClients = db.oauthClients.slice(-499);
    db.oauthClients.push({ id: clientId, redirectUris: clean, createdAt: new Date().toISOString() });
  }
  await writeDb(db);
}
export async function getClient(clientId: string) {
  const { readDb } = await import("./db");
  const db = await readDb();
  return db.oauthClients.find((c) => c.id === clientId);
}
export function newClientId(): string {
  return "cbcli_" + randomBytes(12).toString("hex");
}

// ---- code store (single-use, 10 min TTL, persisted) ----
export async function issueCode(
  userId: string,
  clientId: string,
  redirectUri: string,
  challenge: string,
  method: string
): Promise<string> {
  const { readDb, writeDb } = await import("./db");
  const db = await readDb();
  const now = Date.now();
  db.oauthCodes = db.oauthCodes.filter((c) => c.expires >= now);
  // Per-client cap: one misbehaving agent cannot flood the code table.
  if (db.oauthCodes.filter((c) => c.clientId === clientId).length >= 20)
    throw new Error("too many pending codes for this client");
  const code = "cbcode_" + randomBytes(24).toString("hex");
  db.oauthCodes.push({ code, userId, clientId, redirectUri, challenge, method, expires: now + CODE_TTL_MS });
  await writeDb(db);
  return code;
}
export async function consumeCode(code: string) {
  const { readDb, writeDb } = await import("./db");
  const db = await readDb();
  const now = Date.now();
  const found = db.oauthCodes.find((c) => c.code === String(code || ""));
  const before = db.oauthCodes.length;
  db.oauthCodes = db.oauthCodes.filter((c) => c.code !== String(code || "") && c.expires >= now);
  if (found || db.oauthCodes.length !== before) await writeDb(db);
  if (!found || found.expires < now) return undefined;
  return found;
}

export function pkceOk(method: string, challenge: string, verifier: string): boolean {
  // PKCE is mandatory: a code without challenge must never redeem.
  if (!challenge || !verifier) return false;
  const m = (method || "plain").toUpperCase();
  if (m === "PLAIN") return false; // downgrade risk: only S256 is advertised
  if (m !== "S256") return false;
  const h = createHash("sha256").update(verifier).digest("base64url");
  return h === challenge;
}

export function newPersonalKey(): string {
  // 192-bit entropy, single-use display, long-lived — must resist offline guessing.
  return "cb_" + randomBytes(24).toString("hex");
}
