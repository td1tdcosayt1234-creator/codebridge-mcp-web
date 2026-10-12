import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Roun Free, Pro and Team plans: cloud builds, tokens and billing.",
};

export default function PricingLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
