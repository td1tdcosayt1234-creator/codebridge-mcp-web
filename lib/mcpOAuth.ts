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
  const host =
    (req.headers.get("x-forwarded-host") || req.headers.get("host") || "").split(",")[0].trim();
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

// ---- DCR store (persisted in db.json — Next.js route bundles do NOT share
// module-level memory, so in-process Maps lose codes between /authorize and
// /token) ----
export async function saveClient(clientId: string, redirectUris: string[]) {
  const { readDb, writeDb } = await import("./db");
  const db = await readDb();
  const hit = db.oauthClients.find((c) => c.id === clientId);
  if (hit) hit.redirectUris = redirectUris;
  else db.oauthClients.push({ id: clientId, redirectUris, createdAt: new Date().toISOString() });
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
  if (!challenge) return true; // client did not use PKCE
  const m = (method || "plain").toUpperCase();
  if (m === "PLAIN") return false; // downgrade risk: only S256 is advertised
  if (m !== "S256") return false;
  const h = createHash("sha256").update(verifier).digest("base64url");
  return h === challenge;
}

export function newPersonalKey(): string {
  return (
    "cb_" + randomBytes(9).toString("hex").slice(0, 12) + randomBytes(3).toString("hex").slice(0, 4)
  );
}
