import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Support",
  description: "Contact Roun support: tickets, help and account issues.",
};

export default function SupportLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
