import { NextResponse } from "next/server";
import { resourceMetadata } from "@/lib/mcpOAuth";

export const dynamic = "force-dynamic";

// Served for /.well-known/oauth-protected-resource (exact + path-inserted
// variants) via middleware rewrite — see middleware.ts.
export async function GET(req: Request) {
  return NextResponse.json(resourceMetadata(req));
}
