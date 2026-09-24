import type { ReactNode } from "react";

/** Re-mounts on every navigation, replaying the cinematic page transition. */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="page-transition">{children}</div>;
}
