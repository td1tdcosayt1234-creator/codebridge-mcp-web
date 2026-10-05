import type { MetadataRoute } from "next";

const PAGES = ["", "/about", "/docs", "/docs/game", "/faq", "/game", "/game/history", "/mcp", "/pricing", "/privacy", "/support", "/terms", "/login", "/signup"];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.SITE_URL || "https://exact-pet-eric-www.trycloudflare.com").replace(/\/+$/, "");
  const now = new Date();
  return PAGES.map((p) => ({
    url: base + (p || "/"),
    lastModified: now,
    changeFrequency: p.startsWith("/game") ? "daily" : "weekly",
    priority: p === "" ? 1 : p === "/game" ? 0.9 : 0.6,
  }));
}
