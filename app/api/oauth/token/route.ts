import { NextResponse } from "next/server";
import { readDb, writeDb, uid } from "@/lib/db";
import { consumeCode, newPersonalKey, pkceOk } from "@/lib/mcpOAuth";

export const dynamic = "force-dynamic";

// RFC 6749 token endpoint: authorization_code -> access_token.
// The access_token is the user's personal MCP key (cb_...), so /api/mcp
// accepts it with zero extra plumbing. PKCE S256 verified when challenged.
export async function POST(req: Request) {
  const ct = req.headers.get("content-type") || "";
  let form: FormData | null = null;
  let json: Record<string, unknown> | null = null;
  if (ct.includes("application/json")) json = await req.json().catch(() => null);
  else form = await req.formData().catch(() => null);
  const g = (k: string) => String((form ? form.get(k) : json?.[k]) || "");
  if (g("grant_type") !== "authorization_code")
    return NextResponse.json({ error: "unsupported_grant_type" }, { status: 400 });
  const c = await consumeCode(g("code"));
  if (!c) return NextResponse.json({ error: "invalid_grant" }, { status: 400 });
  if (c.clientId !== g("client_id") || (g("redirect_uri") && c.redirectUri !== g("redirect_uri")))
    return NextResponse.json({ error: "invalid_grant" }, { status: 400 });
  if (!pkceOk(c.method, c.challenge, g("code_verifier")))
    return NextResponse.json({ error: "invalid_grant" }, { status: 400 });

  const db = await readDb();
  let rec = db.mcpKeys.find((k) => k.userId === c.userId);
  if (!rec) {
    rec = { userId: c.userId, key: newPersonalKey() };
    db.mcpKeys.push(rec);
    db.events.push({
      id: uid("e"),
      userId: c.userId,
      action: "mcp_key_oauth",
      detail: "personal MCP key issued via OAuth",
      at: new Date().toISOString(),
    });
    await writeDb(db);
  }
  return NextResponse.json({
    access_token: rec.key,
    token_type: "Bearer",
    expires_in: 31536000,
    scope: "mcp",
  });
}
