import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyJwt } from "@/lib/auth";

// Login gate: no session -> /login?next=/game (mirrors dashboard layout).
export default async function GameLayout({ children }: { children: React.ReactNode }) {
  const t = cookies().get("session")?.value || "";
  const p = await verifyJwt(t);
  if (!p) redirect("/login?next=/game");
  return <>{children}</>;
}
