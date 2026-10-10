import { NextResponse, type NextRequest } from "next/server";
import { verifyJwt } from "@/lib/auth";

// ---- Host layout (every Cloudflare host lands on this same server) ----
//   roun.sryze.cc        public site only (home, docs, pricing, login, game…)
//   dash.roun.sryze.cc   dashboard (/dashboard/*) + admin (/admin/*)
//   api.roun.sryze.cc    MCP surface only (/api/mcp*, OAuth, discovery)
const MAIN_HOST = "roun.sryze.cc";
const DASH_HOST = "dash." + MAIN_HOST;
const API_HOST = "api." + MAIN_HOST;

function hostOf(req: NextRequest): string {
  return (req.headers.get("x-forwarded-host") || req.headers.get("host") || "")
    .split(",")[0]
    .trim()
    .toLowerCase()
    .split(":")[0];
}

// localhost / tailnet / LAN: keep the classic single-origin layout.
function isDevHost(h: string): boolean {
  return (
    h === "localhost" ||
    h === "127.0.0.1" ||
    h === "::1" ||
    h.startsWith("100.") ||
    h.startsWith("192.168.") ||
    h.startsWith("10.") ||
    h.endsWith(".local")
  );
}

// Inside the roun.sryze.cc zone (dash/api handled before this runs).
function isSryzeHost(h: string): boolean {
  return h === MAIN_HOST || h === "www." + MAIN_HOST || h.endsWith("." + MAIN_HOST);
}

// MCP-only API surface (protocol + OAuth + discovery metadata).
function isMcpApi(p: string): boolean {
  return (
    p === "/api/mcp" || p.startsWith("/api/mcp/") ||
    p === "/api/oauth" || p.startsWith("/api/oauth/") ||
    p.startsWith("/.well-known/oauth") || p === "/.well-known/openid-configuration" ||
    p.startsWith("/.well-known/openid-configuration/")
  );
}

// Public-only pages: never rewritten onto the dashboard on the dash host.
const PUBLIC_PAGES = [
  "/about", "/docs", "/faq", "/pricing", "/privacy", "/refund",
  "/terms", "/support", "/login", "/signup", "/game", "/dev",
];
function isPublicPage(p: string): boolean {
  return PUBLIC_PAGES.some((x) => p === x || p.startsWith(x + "/"));
}

function redirectTo(host: string, p: string, search: string): NextResponse {
  return NextResponse.redirect(new URL(p + search, "https://" + host));
}

// Game Studio gate: keep the full path incl. ?prompt= so shared links survive login.
async function gameGate(req: NextRequest, p: string): Promise<NextResponse | null> {
  if (p !== "/game" && !p.startsWith("/game/")) return null;
  const t = req.cookies.get("session")?.value || "";
  const user = await verifyJwt(t);
  if (!user) {
    const next = p + req.nextUrl.search;
    return NextResponse.redirect(new URL("/login?next=" + encodeURIComponent(next), req.url));
  }
  return null;
}

export async function middleware(req: NextRequest) {
  const p = req.nextUrl.pathname;
  const search = req.nextUrl.search;
  const host = hostOf(req);

  // OAuth discovery: dot-folder routes are flaky under Next dev bundling, so
  // they are served from normal /api routes via rewrite (all hosts).
  if (p === "/.well-known/oauth-protected-resource" || p.startsWith("/.well-known/oauth-protected-resource/")) {
    return NextResponse.rewrite(new URL("/api/oauth/protected-resource", req.url));
  }
  if (p === "/.well-known/oauth-authorization-server" || p.startsWith("/.well-known/oauth-authorization-server/")) {
    return NextResponse.rewrite(new URL("/api/oauth/auth-server", req.url));
  }
  if (p === "/.well-known/openid-configuration" || p.startsWith("/.well-known/openid-configuration/")) {
    return NextResponse.rewrite(new URL("/api/oauth/auth-server", req.url));
  }

  // ---- api.roun.sryze.cc : MCP only ----
  if (host === API_HOST) {
    if (isMcpApi(p) || p.startsWith("/api/auth/") || p === "/login" || p.startsWith("/_next/")) {
      return NextResponse.next();
    }
    return new NextResponse("Not found", { status: 404 });
  }

  // ---- dash.roun.sryze.cc : dashboard + admin ----
  // Clean URLs: /tasks serves /dashboard/tasks. Only /admin keeps its prefix
  // (its page names collide with dashboard ones: github, tokens, tracking).
  if (host === DASH_HOST) {
    if (isMcpApi(p)) return redirectTo(API_HOST, p, search); // MCP lives on api subdomain
    if (p === "/" || p === "") return NextResponse.rewrite(new URL("/dashboard" + search, req.url));
    if (p === "/dashboard") return NextResponse.rewrite(new URL("/dashboard" + search, req.url));
    // canonicalise: /dashboard/tasks -> /tasks
    if (p.startsWith("/dashboard/")) return redirectTo(DASH_HOST, p.slice("/dashboard".length), search);
    // already-clean + internals pass straight through
    if (p.startsWith("/admin") || p.startsWith("/api/") || p.startsWith("/_next/")) {
      return NextResponse.next();
    }
    // public marketing pages belong on the main site
    if (isPublicPage(p)) return redirectTo(MAIN_HOST, p, search);
    // everything else is a dashboard page: /tasks -> /dashboard/tasks
    return NextResponse.rewrite(new URL("/dashboard" + p + search, req.url));
  }

  // ---- roun.sryze.cc (and other *.roun.sryze.cc hosts): public site ----
  if (isSryzeHost(host)) {
    if (p.startsWith("/dashboard") || p.startsWith("/admin")) {
      return redirectTo(DASH_HOST, p, search);
    }
    if (isMcpApi(p)) {
      return redirectTo(API_HOST, p, search);
    }
    const gate = await gameGate(req, p);
    if (gate) return gate;
    return NextResponse.next();
  }

  // ---- dev / LAN / unknown hosts (e.g. codebridge.elsemail.indevs.in): full app ----
  const gate = await gameGate(req, p);
  if (gate) return gate;
  return NextResponse.next();
}

export const config = {
  // Host routing needs to see every request; skip Next internals and static files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|txt|xml)$).*)"],
};
