"use client";
import SideNav from "./SideNav";
export default function DashShell({ children }: { children: React.ReactNode }) {
  const items: [string, string, string][] = [
    ["/dashboard", "Overview", "📊"],
    ["/dashboard/tasks", "Requests", "📨"],
    ["/dashboard/builds", "Builds", "⚙️"],
    ["/dashboard/mcp", "Connect Agent", "🔌"],
    ["/dashboard/tokens", "My Coins", "🪙"],
    ["/dashboard/earn", "Earn Coins", "🎁"],
    ["/dashboard/settings", "Settings", "⚙"],
  ];
  return (
    <div style={{ padding: "20px 0" }}>
      <div className="kicker"><span className="pulse-dot" />Dashboard</div>
      <h1 style={{ margin: "0 0 4px", letterSpacing: "-.5px" }}>Mission <span className="grad-anim">control</span></h1>
      <p className="muted small" style={{ marginTop: 0 }}>Requests, coins, builds — everything live.</p>
      <div className="sidebar" style={{ marginTop: 12 }}>
        <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
          <SideNav items={items} />
          <button className="btn-ghost" onClick={() => { fetch("/api/auth/logout", { method: "POST" }).then(() => location.href = "/login"); }}>⎋ Logout</button>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
      </div>
    </div>
  );
}
