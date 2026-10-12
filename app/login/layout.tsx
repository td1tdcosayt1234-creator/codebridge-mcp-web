import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to your Roun account to request builds and manage tokens.",
};

export default function LoginLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
