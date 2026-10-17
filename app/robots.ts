import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: ["/", "/about", "/demo", "/docs", "/docs/game", "/faq", "/mcp", "/pricing", "/privacy", "/security", "/support", "/terms", "/refund"], disallow: ["/admin", "/dashboard", "/api/", "/game", "/login", "/signup"] }],
    sitemap: (process.env.SITE_URL || "https://roun.sryze.cc").replace(/\/+$/, "") + "/sitemap.xml",
  };
}
