import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { listTrusted, revokeTrusted } from "@/lib/mcpAuth";

// Logged-in user's remembered agents ("approve once" list).
export async function GET() {
  const t = cookies().get("session")?.value || "";
  const p = await verifyJwt(t);
  if (!p) return NextResponse.json({ error: "auth" }, { status: 401 });
  return NextResponse.json({ trusted: await listTrusted(p.sub as string) });
}

export async function DELETE(req: Request) {
  const t = cookies().get("session")?.value || "";
  const p = await verifyJwt(t);
  if (!p) return NextResponse.json({ error: "auth" }, { status: 401 });
  const { csrfCheck, csrfBlock } = await import("@/lib/security");
  if (!csrfCheck(req)) return csrfBlock();
  const { id } = await req.json().catch(() => ({}));
  const ok = await revokeTrusted(p.sub as string, String(id || ""));
  if (!ok) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
