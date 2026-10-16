import type { MetadataRoute } from "next";

const PAGES = ["", "/about", "/docs", "/docs/game", "/faq", "/mcp", "/pricing", "/privacy", "/support", "/terms", "/refund"];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.SITE_URL || "https://roun.sryze.cc").replace(/\/+$/, "");
  const now = new Date();
  return PAGES.map((p) => ({
    url: base + (p || "/"),
    lastModified: now,
    changeFrequency: "weekly",
    priority: p === "" ? 1 : 0.6,
  }));
}
