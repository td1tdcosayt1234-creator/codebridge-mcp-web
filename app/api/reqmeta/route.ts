import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// TEMPORARY diagnostic: returns the scheme-related request headers the origin
// receives, so we can see how Cloudflare/cloudflared marks the visitor scheme.
// Delete after the http→https redirect works.
export function GET(req: NextRequest) {
  const scheme = (): string | null => {
    const cfv = req.headers.get("cf-visitor");
    if (!cfv) return null;
    try {
      const parsed = JSON.parse(cfv);
      return typeof parsed === "object" && parsed !== null && typeof parsed.scheme === "string" ? parsed.scheme : cfv;
    } catch {
      return cfv;
    }
  };
  return NextResponse.json(
    {
      ok: true,
      scheme: scheme(),
      headers: {
        "cf-visitor": req.headers.get("cf-visitor"),
        "x-forwarded-proto": req.headers.get("x-forwarded-proto"),
        "x-forwarded-host": req.headers.get("x-forwarded-host"),
        host: req.headers.get("host"),
      },
    },
    { status: 200 },
  );
}

export const dynamic = "force-dynamic";
