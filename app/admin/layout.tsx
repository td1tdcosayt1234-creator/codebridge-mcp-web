import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { verifyJwt } from "@/lib/auth";
import SideNav from "../../components/SideNav";

// Server-side admin gate (replaces edge middleware): non-admin -> 404.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const t = cookies().get("session")?.value || "";
  const p = await verifyJwt(t);
  if (!p || p.role !== "admin") notFound();

  const items: [string, string, string][] = [
    ["/admin", "Overview", "◈"],
    ["/admin/runner", "Runner (Actions)", "▲"],
    ["/admin/github", "GitHub Token", "⚿"],
    ["/admin/ai", "AI Key", "✧"],
    ["/admin/users", "Users", "◎"],
    ["/admin/tokens", "Tokens", "◉"],
    ["/admin/tracking", "Tracking", "◎"],
    ["/admin/mcp-control", "MCP Control", "⌘"],
    ["/admin/content", "Content", "✎"],
    ["/admin/support", "Support", "✦"],
    ["/admin/logs", "Logs", "≡"],
  ];

  return (
    <div style={{ padding: "26px 0 10px" }}>
      <header className="dash-head fade-up">
        <div className="kicker">
          <span className="pulse-dot" />
          Admin only
        </div>
        <h1>
          Admin <span className="grad-anim">Dashboard</span>
        </h1>
        <p>Backend, users, coins, runner — full control.</p>
      </header>

      <div className="sidebar">
        <SideNav items={items} />
        <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
      </div>
    </div>
  );
}
