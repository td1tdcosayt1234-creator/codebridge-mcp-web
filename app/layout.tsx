import "./globals.css";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata = { title: "CodeBridge — OpenCode to GitHub Build Pipeline", description: "MCP web bridge: OpenCode -> GitHub -> GitHub Actions -> Build" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="nav">
          <div className="container nav-inner">
            <Link href="/" className="logo">Code<span>Bridge</span></Link>
            <div className="links">
              <Link href="/pricing">Pricing</Link>
              <Link href="/mcp">MCP</Link>
              <Link href="/docs">Docs</Link>
              <Link href="/faq">FAQ</Link>
              <Link href="/support">Support</Link>
              <Link href="/about">About</Link>
              <Link href="/login">Login</Link>
              <Link href="/signup" className="btn" style={{padding:"8px 12px"}}>Get started</Link>
            </div>
          </div>
        </div>
        <div className="container" style={{minHeight:"60vh",paddingTop:24}}>{children}</div>
        <div className="footer">
          <div className="container" style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
            <div>© {new Date().getFullYear()} CodeBridge • OpenCode → GitHub → Actions</div>
            <div style={{display:"flex",gap:12}}>
              <Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link><Link href="/docs">Docs</Link><Link href="/admin">Admin</Link><Link href="/dashboard">Dashboard</Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
