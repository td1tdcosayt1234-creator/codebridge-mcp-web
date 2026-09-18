import "./globals.css";
import Link from "next/link";
import Footer from "../components/Footer";
import type { ReactNode } from "react";

export const metadata = { title: "CodeBridge — Request to Cloud Build", description: "Send a compile request on the web, OpenCode builds it in the cloud, output comes back to you." };

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
        <Footer />
      </body>
    </html>
  );
}
