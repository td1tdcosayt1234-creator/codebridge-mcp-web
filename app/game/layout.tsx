import type { ReactNode } from "react";

// No auth check here on purpose: edge middleware (middleware.ts) is the
// single login gate for /game and it preserves the full ?prompt=&style=
// query in the ?next= param. A second server gate here used to redirect to
// "/login?next=/game" (dropping the query) and caused login-loop reports.
export default function GameLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
