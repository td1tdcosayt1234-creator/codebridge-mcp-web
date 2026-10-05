import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: ["/", "/about", "/docs", "/docs/game", "/faq", "/game", "/mcp", "/pricing"], disallow: ["/admin", "/dashboard", "/api/"] }],
    sitemap: (process.env.SITE_URL || "https://exact-pet-eric-www.trycloudflare.com").replace(/\/+$/, "") + "/sitemap.xml",
  };
}
