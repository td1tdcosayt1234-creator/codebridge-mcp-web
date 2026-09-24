import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import CinematicBackdrop from "../components/CinematicBackdrop";
import CinematicFX from "../components/CinematicFX";
import Footer from "../components/Footer";
import Nav from "../components/Nav";

export const metadata: Metadata = {
  title: "CodeBridge — Request to Cloud Build",
  description:
    "Send a compile request on the web, OpenCode builds it in the cloud, the output comes back to you.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CinematicBackdrop />
        <CinematicFX />

        <header className="nav">
          <div className="nav-beam" aria-hidden="true" />
          <div className="container nav-inner">
            <Link href="/" className="logo" aria-label="CodeBridge home">
              <span className="logo-mark" aria-hidden="true" />
              <span className="logo-word">
                Code<em>Bridge</em>
              </span>
            </Link>
            <Nav />
          </div>
        </header>

        <main className="container" style={{ minHeight: "58vh", paddingTop: 8, paddingBottom: 32 }}>
          {children}
        </main>

        <Footer />
      </body>
    </html>
  );
}
