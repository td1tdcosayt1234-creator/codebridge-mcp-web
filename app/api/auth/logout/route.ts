import { NextResponse } from "next/server";
import { cookieSecure } from "@/lib/security";
export async function POST(req: Request){
  const r = NextResponse.json({ ok: true });
  // Mirror the login cookie flags exactly — otherwise a Secure-flagged
  // session survives logout on HTTPS deployments.
  r.cookies.set("session", "", { httpOnly: true, path: "/", maxAge: 0, sameSite: "lax", secure: cookieSecure(req) });
  return r;
}
