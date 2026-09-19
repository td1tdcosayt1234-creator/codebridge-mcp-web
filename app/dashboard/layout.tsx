import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyJwt } from "@/lib/auth";
import DashShell from "../../components/DashShell";

// Server-side login gate (replaces edge middleware): no session -> /login.
export default async function DashLayout({ children }: { children: React.ReactNode }) {
  const t = cookies().get("session")?.value || "";
  const p = await verifyJwt(t);
  if (!p) redirect("/login");
  return <DashShell>{children}</DashShell>;
}
