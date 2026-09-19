import { NextResponse } from "next/server";
import { authServerMetadata } from "@/lib/mcpOAuth";

export const dynamic = "force-dynamic";

// Served for /.well-known/oauth-authorization-server and
// /.well-known/openid-configuration via middleware rewrite — see middleware.ts.
export async function GET(req: Request) {
  return NextResponse.json(authServerMetadata(req));
}
