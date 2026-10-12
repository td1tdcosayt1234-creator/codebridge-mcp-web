import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create a free CodeBridge account with 10,000 tokens included.",
};

export default function SignupLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
