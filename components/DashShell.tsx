"use client";
import SideNav from "./SideNav";

export default function DashShell({ children }: { children: React.ReactNode }) {
  const items: [string, string, string][] = [
    ["/dashboard", "Overview", "◈"],
    ["/dashboard/tasks", "Requests", "↗"],
    ["/dashboard/builds", "Builds", "⚙"],
    ["/dashboard/mcp", "Connect Agent", "⌘"],
    ["/dashboard/tokens", "My Coins", "◉"],
    ["/dashboard/uses", "Uses", "◍"],
    ["/dashboard/earn", "Earn Coins", "✦"],
    ["/dashboard/settings", "Settings", "⚒"],
  ];

  return (
    <div style={{ padding: "26px 0 10px" }}>
      <header className="dash-head fade-up">
        <div className="kicker">
          <span className="pulse-dot" />
          Mission control
        </div>
        <h1>
          Your <span className="grad-anim">dashboard</span>
        </h1>
        <p>Requests, coins and builds — live, in one place.</p>
      </header>

      <div className="sidebar">
        <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
          <SideNav items={items} />
          <button
            className="btn-ghost"
            onClick={() => {
              fetch("/api/auth/logout", { method: "POST" }).then(() => (location.href = "/login"));
            }}
          >
            ⎋ Logout
          </button>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
      </div>
    </div>
  );
}
