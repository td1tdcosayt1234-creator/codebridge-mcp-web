import { NextResponse } from "next/server";
import { newClientId, saveClient } from "@/lib/mcpOAuth";

export const dynamic = "force-dynamic";

// RFC 7591 Dynamic Client Registration — one call, no auth needed.
// Body: { redirect_uris: [...], client_name?: ... }
// Returns: { client_id, ... } — the client then opens the browser authorize URL.
export async function POST(req: Request) {
  let body: { redirect_uris?: string[]; client_name?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  const uris = Array.isArray(body.redirect_uris) ? body.redirect_uris.filter(Boolean).slice(0, 10) : [];
  if (uris.length === 0)
    return NextResponse.json({ error: "invalid_redirect_uri" }, { status: 400 });
  const clientId = newClientId();
  await saveClient(clientId, uris.map(String));
  return NextResponse.json(
    {
      client_id: clientId,
      client_name: String(body.client_name || "MCP client"),
      redirect_uris: uris,
      grant_types: ["authorization_code"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
    },
    { status: 201 }
  );
}
