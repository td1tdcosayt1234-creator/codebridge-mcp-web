import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import * as jose from "jose";

async function sessionRole(req: NextRequest): Promise<string | null> {
  const t = req.cookies.get("session")?.value || "";
  if (!t) return null;
  try {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "dev-secret-change-me-please-32chars");
    const { payload } = await jose.jwtVerify(t, secret);
    return (payload as { role?: string }).role || "user";
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (path.startsWith("/dashboard")) {
    const role = await sessionRole(req);
    if (!role) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }
  if (path.startsWith("/admin")) {
    const role = await sessionRole(req);
    if (role !== "admin") {
      // 404 when not logged in or not admin
      const url = req.nextUrl.clone();
      url.pathname = "/not-found";
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }
  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*", "/admin/:path*"] };
