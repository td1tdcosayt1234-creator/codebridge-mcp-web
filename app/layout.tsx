import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import CinematicBackdrop from "../components/CinematicBackdrop";
import CinematicFX from "../components/CinematicFX";
import Footer from "../components/Footer";
import Nav from "../components/Nav";
import GoogleAnalytics from "../components/GoogleAnalytics";

const PUBLIC_HOSTS = ["roun.sryze.cc", "www.roun.sryze.cc"];

function reqHost(): string {
  try {
    const h = headers();
    return ((h.get("x-forwarded-host") || h.get("host") || "").split(",")[0] || "")
      .trim().toLowerCase().split(":")[0];
  } catch {
    return "";
  }
}

function reqPath(): string {
  try {
    return (headers().get("x-pathname") || "").split("?")[0].trim().toLowerCase();
  } catch {
    return "";
  }
}

// Host-aware metadata: ONLY the public site is indexable. dash/api hosts
// serve app UI / MCP — indexing them creates duplicate + login-walled pages.
export async function generateMetadata(): Promise<Metadata> {
  const host = reqHost();
  const indexable = PUBLIC_HOSTS.includes(host) || host === "" || host === "localhost";
  const base = (process.env.SITE_URL || "https://roun.sryze.cc").replace(/\/+$/, "");
  let cpath = reqPath();
  if (!cpath.startsWith("/")) cpath = "/" + cpath;
  if (cpath.length > 1) cpath = cpath.replace(/\/+$/, "");
  return {
    title: {
      default: "Roun — Request to Cloud Build",
      template: "%s | Roun",
    },    description:
      "Send a compile request on the web, Roun Co Pilot builds it in the cloud, the output comes back to you. Plus Game Studio: plan, build and play AI games.",
    keywords: ["Roun", "Roun Co Pilot", "cloud build", "compile online", "AI fix", "APK build", "Game Studio", "roun.sryze.cc"],
    metadataBase: new URL(process.env.SITE_URL || "https://roun.sryze.cc"),
    alternates: indexable ? { canonical: base + cpath } : undefined,
    robots: indexable ? { index: true, follow: true } : { index: false, follow: false },
    verification: process.env.GOOGLE_SITE_VERIFICATION
      ? { google: process.env.GOOGLE_SITE_VERIFICATION }
      : undefined,
    openGraph: {
      title: "Roun — Request to Cloud Build + Game Studio",
      description: "Cloud builds with AI auto-fix. Chat to plan, build and play single-file HTML5 games.",
      type: "website",
      url: cpath,
      siteName: "Roun",
    },
    twitter: { card: "summary_large_image", title: "Roun", description: "Request → cloud build → result. Plus AI Game Studio." },
    icons: {
      icon: [
        { url: "/icon.svg", type: "image/svg+xml" },
        { url: "/icon.png", type: "image/png", sizes: "512x512" },
      ],
      apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    },
    themeColor: "#070a14",
  };
}

export default function RootLayout({ children }: { children: ReactNode }) {
  const gaId = PUBLIC_HOSTS.includes(reqHost()) ? process.env.NEXT_PUBLIC_GA_ID || "" : "";
  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Roun",
              url: "https://roun.sryze.cc",
              description:
                "Send a compile request on the web, Roun Co Pilot builds it in the cloud. Plus AI Game Studio.",
            }),
          }}
        />
        <CinematicBackdrop />
        <CinematicFX />
        <GoogleAnalytics id={gaId} />

        <header className="nav">
          <div className="nav-beam" aria-hidden="true" />
          <div className="container nav-inner">
            <Link href="/" className="logo" aria-label="Roun home">
              <span className="logo-mark" aria-hidden="true" />
              <span className="logo-word">
                Roun
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
