"use client";

import Script from "next/script";

// Google Analytics 4 — renders only when NEXT_PUBLIC_GA_ID is set.
// Mounted from the root layout on the public host only, so dash/api
// app traffic never pollutes website analytics.
export default function GoogleAnalytics({ id }: { id: string }) {
  if (!id) return null;
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${id}');
        `}
      </Script>
    </>
  );
}
