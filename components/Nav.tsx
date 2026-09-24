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

const MOBILE_LINKS: [string, string][] = [
  ...LINKS,
  ["/support", "Support"],
  ["/login", "Login"],
];

export default function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [path]);

  useEffect(() => {
    if (!open) return;
    const onResize = () => {
      if (window.innerWidth > 940) setOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open]);

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
        <Link href="/login" className="link-pill">
          Login
        </Link>
        <Link href="/signup" className="btn nav-cta shine">
          Get started
        </Link>
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
        {MOBILE_LINKS.map(([href, label]) => (
          <Link key={href} className={"link-pill" + (active(href) ? " active" : "")} href={href}>
            {label}
          </Link>
        ))}
        <Link href="/signup" className="btn">
          Get started free
        </Link>
      </div>
    </>
  );
}
