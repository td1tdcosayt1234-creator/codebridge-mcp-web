import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Game History",
  description: "Reload, preview or delete your previously built AI games.",
};

export default function GameHistoryLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
