import "./globals.css";
import Link from "next/link";
import Footer from "../components/Footer";
import type { ReactNode } from "react";

export const metadata = { title: "CodeBridge — Request to Cloud Build", description: "Send a compile request on the web, OpenCode builds it in the cloud, output comes back to you." };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="bg-stage" aria-hidden="true"><div className="orb orb-a" /><div className="orb orb-b" /><div className="orb orb-c" /><div className="stars" /></div>
        <div className="vignette" aria-hidden="true" />
        <div className="grain" aria-hidden="true" />
        <div className="nav">
          <div className="nav-beam" aria-hidden="true" />
          <div className="container nav-inner">
            <Link href="/" className="logo"><span className="logo-orb" aria-hidden="true" />Code<span className="grad-anim">Bridge</span></Link>
            <nav className="links">
              <Link className="link-pill" href="/pricing">Pricing</Link>
              <Link className="link-pill" href="/mcp">MCP</Link>
              <Link className="link-pill" href="/docs">Docs</Link>
              <Link className="link-pill" href="/faq">FAQ</Link>
              <Link className="link-pill" href="/support">Support</Link>
              <Link className="link-pill" href="/about">About</Link>
              <Link className="link-pill" href="/login">Login</Link>
              <Link href="/signup" className="btn nav-cta">Get started</Link>
            </nav>
          </div>
        </div>
        <div className="container" style={{minHeight:"60vh",paddingTop:24}}>{children}</div>
        <Footer />
      </body>
    </html>
  );
}
