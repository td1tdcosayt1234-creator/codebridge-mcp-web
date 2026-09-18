import { NextResponse } from "next/server";
import { readDb, writeDb, uid } from "@/lib/db";

export const dynamic = "force-dynamic";
const PROTOCOL = "2025-06-18";
const GUEST_ID = "mcp_guest";
const GUEST_DAILY = 2000;

// No headers needed: log in on the website and add this MCP —
// identity resolves from optional key, else login cookie, else shared guest pool.
const TOOLS = [
  {
    name: "compile",
    description: "Compile anything (all types): send title + instructions + optional files. AI compiles in the cloud and this call waits up to ~45s for the live result. Bigger files cost more coins.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "short title" },
        prompt: { type: "string", description: "exactly what should be compiled" },
        files: {
          type: "array",
          description: "optional files to compile (max 200KB total)",
          items: {
            type: "object",
            properties: { path: { type: "string" }, content: { type: "string" } },
            required: ["path", "content"],
          },
        },
      },
      required: ["title", "prompt"],
    },
  },
  {
    name: "compile_fix",
    description: "Compile with AI fix: like compile, but on failure the AI repairs the code itself and retries (max 3). Fix size costs extra coins. Waits up to ~45s for the live result.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "short title" },
        prompt: { type: "string", description: "exactly what should be compiled/fixed" },
        files: {
          type: "array",
          description: "optional files to compile (max 200KB total)",
          items: {
            type: "object",
            properties: { path: { type: "string" }, content: { type: "string" } },
            required: ["path", "content"],
          },
        },
      },
      required: ["title", "prompt"],
    },
  },
];

type RpcMsg = { jsonrpc?: string; id?: string | number | null; method?: string; params?: Record<string, unknown> };

function ok(id: string | number | null, result: unknown) {
  return NextResponse.json({ jsonrpc: "2.0", id, result }, { headers: { "MCP-Protocol-Version": PROTOCOL } });
}
function err(id: string | number | null, code: number, message: string) {
  return NextResponse.json(
    { jsonrpc: "2.0", id: id ?? null, error: { code, message } },
    { headers: { "MCP-Protocol-Version": PROTOCOL } }
  );
}
function text(t: string, isError = false) {
  return { content: [{ type: "text", text: t }], ...(isError ? { isError: true } : {}) };
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

// Identity: optional personal key -> login session cookie -> shared guest pool.
async function resolveUser(req: Request): Promise<{ userId: string; guest: boolean }> {
  const db = await readDb();
  const h = req.headers.get("authorization") || "";
  const key = h.toLowerCase().startsWith("bearer ") ? h.slice(7).trim() : "";
  if (key) {
    const hit = db.mcpKeys.find((k) => k.key === key);
    if (hit) return { userId: hit.userId, guest: false };
  }
  const cookies = req.headers.get("cookie") || "";
  const m = cookies.split(";").map((s) => s.trim()).find((s) => s.startsWith("session="));
  if (m) {
    try {
      const { verifyJwt } = await import("@/lib/auth");
      const p = await verifyJwt(decodeURIComponent(m.slice(8)));
      if (p?.sub && db.users.some((u) => u.id === p.sub)) return { userId: p.sub as string, guest: false };
    } catch { /* fall through to guest */ }
  }
  // Shared guest pool (refilled daily) so headerless MCP just works after login.
  db.settings = db.settings || { builderRepo: "", builderWorkflow: "opencode-task.yml", runnerTokenEnc: "", updatedBy: "", updatedAt: "" };
  let g = db.usage.find((u) => u.userId === GUEST_ID);
  if (!g) {
    g = { userId: GUEST_ID, mcpCalls: 0, githubCalls: 0, balance: GUEST_DAILY, usedTotal: 0 };
    db.usage.push(g);
  }
  const s = db.settings as typeof db.settings & { lastGuestRefill?: string };
  if (s.lastGuestRefill !== todayKey()) {
    s.lastGuestRefill = todayKey();
    g.balance = GUEST_DAILY;
  }
  await writeDb(db);
  return { userId: GUEST_ID, guest: true };
}

async function track(userId: string, tool: string, detail: string) {
  try {
    const db = await readDb();
    const us = db.usage.find((u) => u.userId === userId);
    if (us) us.mcpCalls += 1;
    db.events.push({ id: uid("e"), userId, action: "mcp_tool_call", detail: tool + " " + detail, at: new Date().toISOString() });
    await writeDb(db);
  } catch { /* best effort */ }
}

async function callTool(req: Request, name: string, args: Record<string, unknown>) {
  const { userId, guest } = await resolveUser(req);
  if (name !== "compile" && name !== "compile_fix") return text("Unknown tool: " + name, true);
  const { createTaskAndDispatch, waitForResult } = await import("@/lib/tasks");
  const files = Array.isArray(args.files) ? (args.files as { path: string; content: string }[]) : [];
  const out = await createTaskAndDispatch(userId, String(args.title || ""), String(args.prompt || ""), {
    kind: name === "compile_fix" ? "fix-compile" : "compile", files,
  });
  if ("error" in out) return text(out.error, true);
  await track(userId, name, out.task.id);
  const id = out.task.id;
  const head = "task_id=" + id + " (" + out.task.kind + ", ~" + out.task.tokensEst + " coins held)" + (guest ? " [shared guest pool]" : "") + "\n";
  const t = await waitForResult(id, 45000);
  if (!t) return text(head + "Task vanished unexpectedly.", true);
  const tail = (s: string) => (s || "-").slice(-6000);
  if (t.status === "done" || t.status === "failed") {
    await track(userId, name + "_result", id);
    return text(head + "[" + t.status.toUpperCase() + "] " + t.title + " (charged " + t.tokensCharged + " coins)\n--- log ---\n" + tail(t.log) + "\n--- result ---\n" + tail(t.result));
  }
  return text(head + "Still " + t.status + " after 45s — the cloud runner is still working. Check the dashboard Tasks page (id " + id + ") for the live output.");
}

async function handleOne(req: Request, m: RpcMsg): Promise<{ resp: object | null }> {
  if (!m || m.jsonrpc !== "2.0" || typeof m.method !== "string") {
    return { resp: { jsonrpc: "2.0", id: (m && m.id) ?? null, error: { code: -32600, message: "Invalid Request" } } };
  }
  const isNotif = m.id === undefined || m.id === null;
  if (isNotif) return { resp: null };
  const id = m.id as string | number;
  if (m.method === "initialize") {
    return {
      resp: {
        jsonrpc: "2.0", id,
        result: {
          protocolVersion: PROTOCOL,
          capabilities: { tools: {} },
          serverInfo: { name: "codebridge", version: "2.0.0" },
        },
      },
    };
  }
  if (m.method === "ping") return { resp: { jsonrpc: "2.0", id, result: {} } };
  if (m.method === "tools/list") return { resp: { jsonrpc: "2.0", id, result: { tools: TOOLS } } };
  if (m.method === "tools/call") {
    const p = (m.params || {}) as { name?: string; arguments?: Record<string, unknown> };
    if (!p.name) return { resp: { jsonrpc: "2.0", id, error: { code: -32602, message: "Missing tool name" } } };
    const result = await callTool(req, p.name, p.arguments || {});
    return { resp: { jsonrpc: "2.0", id, result } };
  }
  return { resp: { jsonrpc: "2.0", id, error: { code: -32601, message: "Method not found: " + m.method } } };
}

export async function POST(req: Request) {
  const { rateLimit, clientIp } = await import("@/lib/security");
  const rl = rateLimit("mcp:" + clientIp(req), 120, 60 * 1000);
  if (!rl.ok) return err(null, -32000, "Rate limited. Retry in " + rl.retryAfterSec + "s.");
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return err(null, -32700, "Parse error");
  }
  const batch = Array.isArray(body) ? (body as RpcMsg[]) : [body as RpcMsg];
  const out: object[] = [];
  for (const m of batch) {
    const r = await handleOne(req, m);
    if (r.resp) out.push(r.resp);
  }
  if (out.length === 0) return new Response(null, { status: 202 });
  const payload = Array.isArray(body) ? out : out[0];
  return NextResponse.json(payload, { headers: { "MCP-Protocol-Version": PROTOCOL } });
}

export async function GET(req: Request) {
  const accept = req.headers.get("accept") || "";
  if (accept.includes("text/event-stream")) {
    return new Response("SSE streams not supported — use POST Streamable HTTP.", { status: 405 });
  }
  return NextResponse.json({
    mcp: { name: "codebridge", protocol: PROTOCOL, url: "/api/mcp", auth: "none — just log in on the website", tools: TOOLS.map((t) => t.name) },
  });
}
