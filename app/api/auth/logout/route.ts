import { NextResponse } from "next/server";
import { cookieSecure, cookieDomain } from "@/lib/security";
export async function POST(req: Request){
  const { csrfCheck, csrfBlock } = await import("@/lib/security");
  if (!csrfCheck(req)) return csrfBlock();
  const r = NextResponse.json({ ok: true });
  // Mirror the login cookie flags exactly — otherwise a Secure-flagged
  // session survives logout on HTTPS deployments.
  r.cookies.set("session", "", { httpOnly: true, path: "/", domain: cookieDomain(req), maxAge: 0, sameSite: "lax", secure: cookieSecure(req) });
  return r;
}
