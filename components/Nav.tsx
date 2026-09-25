"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const LINKS: [string, string][] = [
  ["/game", "Game Studio"],
  ["/pricing", "Pricing"],
  ["/mcp", "MCP"],
  ["/docs", "Docs"],
  ["/faq", "FAQ"],
  ["/about", "About"],
];

type Me = { email?: string; role?: string } | null;

export default function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [me, setMe] = useState<Me>(null);

  useEffect(() => setOpen(false), [path]);

  // Re-check session on every navigation: login/logout instantly updates the nav.
  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setMe(j.user || null))
      .catch(() => setMe(null));
  }, [path]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    window.location.href = "/";
  }

  const pillBtn: React.CSSProperties = {
    background: "transparent",
    border: 0,
    cursor: "pointer",
    font: "inherit",
  };

  const active = (h: string) => path === h || (h !== "/" && path.startsWith(h + "/"));

  return (
    <>
      <nav className="links desktop" aria-label="Primary">
        {LINKS.map(([href, label]) => (
          <Link key={href} className={"link-pill" + (active(href) ? " active" : "")} href={href}>
            {label}
          </Link>
        ))}
      </nav>

      <div className="nav-actions">
        {me ? (
          <>
            <Link
              href={me.role === "admin" ? "/admin" : "/dashboard"}
              className={"link-pill" + (active(me.role === "admin" ? "/admin" : "/dashboard") ? " active" : "")}
            >
              {me.role === "admin" ? "Admin" : "Dashboard"}
            </Link>
            <button type="button" className="btn nav-cta shine" onClick={logout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="link-pill">
              Login
            </Link>
            <Link href="/signup" className="btn nav-cta shine">
              Get started
            </Link>
          </>
        )}
        <button
          type="button"
          className="nav-toggle"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <div className={"nav-menu" + (open ? " open" : "")}>
        {LINKS.map(([href, label]) => (
          <Link key={href} className={"link-pill" + (active(href) ? " active" : "")} href={href}>
            {label}
          </Link>
        ))}
        <Link href="/support" className={"link-pill" + (active("/support") ? " active" : "")}>
          Support
        </Link>
        {me ? (
          <>
            <Link
              href={me.role === "admin" ? "/admin" : "/dashboard"}
              className="link-pill"
            >
              {me.role === "admin" ? "Admin" : "Dashboard"}
            </Link>
            <button type="button" className="link-pill" style={pillBtn} onClick={logout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="link-pill">
              Login
            </Link>
            <Link href="/signup" className="btn">
              Get started free
            </Link>
          </>
        )}
      </div>
    </>
  );
}
