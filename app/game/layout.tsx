import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Game Studio",
  description: "Describe a game, get a plan, confirm the build and play it instantly.",
};

// No auth check here on purpose: edge middleware (middleware.ts) is the
// single login gate for /game and it preserves the full ?prompt=&style=
// query in the ?next= param. A second server gate here used to redirect to
// "/login?next=/game" (dropping the query) and caused login-loop reports.
export default function GameLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
