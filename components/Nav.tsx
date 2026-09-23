"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS: [string, string][] = [
  ["/game", "🎮 Game"],
  ["/pricing", "Pricing"],
  ["/mcp", "MCP"],
  ["/docs", "Docs"],
  ["/faq", "FAQ"],
  ["/support", "Support"],
  ["/about", "About"],
  ["/login", "Login"],
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="links">
      {LINKS.map(([h, t]) => (
        <Link
          key={h}
          className={"link-pill" + (path === h || (h !== "/" && path.startsWith(h + "/")) ? " active" : "")}
          href={h}
          style={h === "/game" ? { background: "#6c8cff18", border: "1px solid #6c8cff33" } : undefined}
        >
          {t}
        </Link>
      ))}
      <Link href="/signup" className="btn nav-cta">Get started</Link>
    </nav>
  );
}
