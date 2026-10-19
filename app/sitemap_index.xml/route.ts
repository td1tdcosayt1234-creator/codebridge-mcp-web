// sitemap_index.xml — master index: our two public hosts both verified in
// Search Console, so the cross-subdomain entries are valid.
const SITE = (process.env.SITE_URL || "https://roun.sryze.cc").replace(/\/+$/, "");

export function GET(): Response {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${SITE}/sitemap.xml</loc></sitemap>
  <sitemap><loc>https://dash.roun.sryze.cc/sitemap.xml</loc></sitemap>
</sitemapindex>`;
  return new Response(xml, {
    headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
  });
}
