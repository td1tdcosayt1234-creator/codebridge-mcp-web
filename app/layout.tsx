import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import CinematicBackdrop from "../components/CinematicBackdrop";
import CinematicFX from "../components/CinematicFX";
import Footer from "../components/Footer";
import Nav from "../components/Nav";
import MonetagTag from "../components/ads/MonetagTag";

// Monetag Multitag loads client-side (site already verified in dashboard).
// Auth pages (/signup, /login) are excluded inside <MonetagTag/> so the
// OnClick popunder can never hijack form taps.
// Standalone Vignette renders server-side in <head> on the public host so
// Monetag's installer bot sees it in the HTML (banner never hijacks taps,
// so auth pages are safe).

const VIG_SRC = "https://n6wxm.com/vignette.min.js";
const VIG_ZONE = "11997991";
const PUBLIC_HOSTS = ["roun.sryze.cc", "www.roun.sryze.cc"];

export const metadata: Metadata = {
  title: "CodeBridge — Request to Cloud Build",
  description:
    "Send a compile request on the web, OpenCode builds it in the cloud, the output comes back to you. Plus Game Studio: plan, build and play AI games.",
  metadataBase: new URL(process.env.SITE_URL || "https://roun.sryze.cc"),
  openGraph: {
    title: "CodeBridge — Request to Cloud Build + Game Studio",
    description: "Cloud builds with AI auto-fix. Chat to plan, build and play single-file HTML5 games.",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "CodeBridge", description: "Request → cloud build → result. Plus AI Game Studio." },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  let vigHead = false;
  try {
    const h = headers();
    const host = ((h.get("x-forwarded-host") || h.get("host") || "").split(",")[0] || "")
      .trim().toLowerCase().split(":")[0];
    vigHead = PUBLIC_HOSTS.includes(host);
  } catch {
    vigHead = false;
  }
  return (
    <html lang="en">
      <head>
        {vigHead && (
          <script src={VIG_SRC} data-zone={VIG_ZONE} async data-cfasync="false" />
        )}
      </head>
      <body>
        <CinematicBackdrop />
        <CinematicFX />
        <MonetagTag />

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
