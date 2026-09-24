import { NextResponse, type NextRequest } from "next/server";
import { verifyJwt } from "@/lib/auth";

// OAuth discovery lives under /.well-known/..., but Next.js dev bundling of
// routes inside dot-folders is flaky (intermittent MODULE_NOT_FOUND -> HTTP
// 500 on some hits). Serve them from normal /api routes via rewrite instead.
export async function middleware(req: NextRequest) {
  const p = req.nextUrl.pathname;
  if (p === "/.well-known/oauth-protected-resource" || p.startsWith("/.well-known/oauth-protected-resource/")) {
    return NextResponse.rewrite(new URL("/api/oauth/protected-resource", req.url));
  }
  if (p === "/.well-known/oauth-authorization-server" || p.startsWith("/.well-known/oauth-authorization-server/")) {
    return NextResponse.rewrite(new URL("/api/oauth/auth-server", req.url));
  }
  if (p === "/.well-known/openid-configuration" || p.startsWith("/.well-known/openid-configuration/")) {
    return NextResponse.rewrite(new URL("/api/oauth/auth-server", req.url));
  }
  // Game Studio gate: keep the full path incl. ?prompt= so shared links survive login.
  if (p === "/game") {
    const t = req.cookies.get("session")?.value || "";
    const user = await verifyJwt(t);
    if (!user) {
      const next = p + req.nextUrl.search;
      return NextResponse.redirect(new URL("/login?next=" + encodeURIComponent(next), req.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/.well-known/:path*", "/game"],
};
