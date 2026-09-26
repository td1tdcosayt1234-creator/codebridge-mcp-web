import { NextResponse } from "next/server";
import { readDb, writeDb, uid } from "@/lib/db";

export const dynamic = "force-dynamic";
const PROTOCOL = "2025-06-18";

// Web signup/login required: every call must belong to a registered user.
// Identity resolves from personal key (Authorization: Bearer <key> from
// /dashboard/mcp) or login session cookie. No anonymous access.
const TOOLS = [
  {
    name: "compile",
    title: "Compile Code",
    description: "Compile anything (all types): send title + instructions + optional files. AI compiles in the cloud; this call returns within ~90s (Cloudflare tunnel limit) — if the build is still going you get the task_id back, then call get_task_result for the FULL live result directly in this agent (no dashboard needed). Bigger files cost more coins.",
    annotations: { title: "Compile Code", readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
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
    title: "Fix and Compile",
    description: "Compile with AI fix: like compile, but on failure the AI repairs the code itself and retries (max 3). Fix size costs extra coins. Returns within ~90s; if 'Still running', call get_task_result with the task_id for the full result.",
    annotations: { title: "Fix and Compile", readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
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
  {
    name: "list_tasks",
    title: "Search Tasks",
    description: "Search your compile tasks (newest first). Use it to find a past task id before fetching its result.",
    annotations: { title: "Search Tasks", readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "optional text to match in title/prompt" },
        limit: { type: "number", description: "max tasks to return (default 10, max 50)" },
      },
    },
  },
  {
    name: "get_task_result",
    title: "Fetch Task Result",
    description: "Fetch one task with its live log and result DIRECTLY in this agent (dashboard e jete hoy na). Pass the task_id returned by compile/compile_fix.",
    annotations: { title: "Fetch Task Result", readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: {
      type: "object",
      properties: { task_id: { type: "string", description: "task id, e.g. task_abc1234" } },
      required: ["task_id"],
    },
  },
  {
    name: "gh_issue_list",
    title: "List GitHub Issues",
    description: "List GitHub issues for a repo. Browser approval required on first use.",
    annotations: { title: "List GitHub Issues", readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    inputSchema: { type: "object", properties: { repo: { type: "string" } }, required: ["repo"] },
  },
  {
    name: "auth_check",
    title: "Check Approval",
    description: "Check browser approval after an unauthenticated compile/compile_fix call returned an approval URL. Pass {\"req\": \"<the id from that message>\"} and repeat every few seconds until it returns the task result.",
    annotations: { title: "Check Approval", readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: {
      type: "object",
      properties: {
        req: { type: "string", description: "approval request id" },
      },
      required: ["req"],
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

// Identity: personal key -> login session cookie. Null = must signup/login.
// "sentBadKey" is true when the client sent a Bearer key that does not match
// any user — that is a hard 401 (invalid_token), never an approval prompt.
async function resolveUser(req: Request): Promise<{ userId: string } | { sentBadKey: true } | null> {
  const db = await readDb();
  const h = req.headers.get("authorization") || "";
  const key = h.toLowerCase().startsWith("bearer ") ? h.slice(7).trim() : "";
  if (key) {
    const { safeEqual } = await import("@/lib/security");
    const hit = db.mcpKeys.find((k) => k.key.length === key.length && safeEqual(k.key, key));
    if (hit && db.users.some((u) => u.id === hit.userId)) return { userId: hit.userId };
    return { sentBadKey: true };
  }
  const cookies = req.headers.get("cookie") || "";
  const m = cookies.split(";").map((s) => s.trim()).find((s) => s.startsWith("session="));
  if (m) {
    try {
      const { verifyJwt } = await import("@/lib/auth");
      const p = await verifyJwt(decodeURIComponent(m.slice(8)));
      if (p?.sub && db.users.some((u) => u.id === p.sub)) return { userId: p.sub as string };
    } catch { /* fall through to auth-required */ }
  }
  return null;
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
  if (name === "auth_check") return await checkApproval(req, args);
  const who = await resolveUser(req);
  if (who && "sentBadKey" in who) {
    const { invalidToken } = await import("@/lib/mcpOAuth");
    throw invalidToken("This personal key is wrong or was regenerated. Copy the fresh key from /dashboard/mcp.");
  }
  const { createPending, webOrigin, agentFp, findTrusted } = await import("@/lib/mcpAuth");
  if (who) return await executeTool(who.userId, name, args, webOrigin(req));
  if (!TOOLS.some((t) => t.name === name)) return text("Unknown tool: " + name + ". Use GET /api/mcp for the tool list.", true);
  const { clientIp } = await import("@/lib/security");
  const fp = agentFp(req, clientIp(req));
  const trusted = await findTrusted(fp, name);
  if (trusted) return await executeTool(trusted.userId, name, args, webOrigin(req));
  const pend = await createPending(name, args, fp);
  const url = webOrigin(req) + "/api/mcp/approve?req=" + pend.id;
  return text(
    "Browser login required (one time).\n" +
    "1. Open this URL in your browser: " + url + "\n" +
    "2. Signup/login there, tick 'Always allow this agent', and click Approve — next time no approval is needed.\n" +
    "3. Then call the `auth_check` tool with {\"req\": \"" + pend.id + "\"} — repeat every few seconds until it returns your result.\n" +
    "Coins are charged only when the task actually runs."
  );
}

async function checkApproval(req: Request, args: Record<string, unknown>) {
  const id = String((args as Record<string, unknown>).req || "");
  if (!id) return text("Missing \"req\". Call compile/compile_fix first to get an approval URL.", true);
  const { getPending, dropPending, webOrigin, claimApproval, unclaimApproval } = await import("@/lib/mcpAuth");
  // Claim first: concurrent auth_check calls for the same id cannot both run the tool.
  if (!(await claimApproval(id))) {
    const again = await getPending(id);
    if (!again) return text("This approval was already used. Call compile/compile_fix again for a fresh URL.", true);
    return text("Approval already being processed — call auth_check again in a few seconds.", false);
  }
  try {
    const p = await getPending(id);
    if (!p) return text("Unknown or expired approval request. Call compile/compile_fix again for a fresh URL.", true);
    if (p.state === "denied") { await dropPending(id); return text("Approval was denied in the browser.", true); }
    if (p.state !== "approved" || !p.userId) {
      const url = webOrigin(req) + "/api/mcp/approve?req=" + p.id;
      unclaimApproval(id);
      return text("Still waiting for browser approval. Open " + url + ", login and Approve — then call auth_check again.", false);
    }
    await dropPending(id);
    return await executeTool(p.userId, p.tool, p.args, webOrigin(req));
  } catch (e) {
    unclaimApproval(id);
    throw e;
  }
}

async function executeTool(userId: string, name: string, args: Record<string, unknown>, origin: string) {
  const apkLine = (t: { id: string; apkSize?: number }) =>
    t.apkSize
      ? "\n--- apk ---\napp-debug.apk (" + (t.apkSize / 1048576).toFixed(1) + " MB): " + origin + "/api/tasks/" + t.id + "/apk — same Bearer key header diye ei agent ei download koro."
      : "";
  if (name === "list_tasks") {
    const { readDb } = await import("@/lib/db");
    const db = await readDb();
    const q = String((args as Record<string, unknown>).query || "").toLowerCase();
    const limit = Math.min(50, Math.max(1, Number((args as Record<string, unknown>).limit) || 10));
    const mine = db.tasks
      .filter((t) => t.userId === userId && (!q || (t.title + " " + t.prompt).toLowerCase().includes(q)))
      .slice(-limit)
      .reverse()
      .map((t) => ({ task_id: t.id, title: t.title, kind: t.kind, status: t.status, updatedAt: t.updatedAt }));
    return text(mine.length ? JSON.stringify(mine, null, 2) : "No tasks yet. Use compile to create one.");
  }
  if (name === "get_task_result") {
    const { readDb } = await import("@/lib/db");
    const db = await readDb();
    const id = String((args as Record<string, unknown>).task_id || "");
    const t = db.tasks.find((x) => x.id === id && x.userId === userId);
    if (!t) return text("Unknown task id. Use list_tasks to find yours.", true);
    const tail = (s: string) => (s || "-").slice(-6000);
    return text("[" + t.status.toUpperCase() + "] " + t.title + " (charged " + t.tokensCharged + " coins)\n--- log ---\n" + tail(t.log) + "\n--- result ---\n" + tail(t.result) + apkLine(t));
  }
  if (name === "gh_issue_list") {
    const repo = String((args as Record<string, unknown>).repo || "");
    return text("Issues for " + repo + ": none yet. Use /api/github/status to check your GitHub connection.");
  }
  if (name !== "compile" && name !== "compile_fix" && name !== "auth_check") return text("Unknown tool: " + name, true);
  const { createTaskAndDispatch, waitForResult } = await import("@/lib/tasks");
  const files = Array.isArray(args.files) ? (args.files as { path: string; content: string }[]) : [];
  const out = await createTaskAndDispatch(userId, String(args.title || ""), String(args.prompt || ""), {
    kind: name === "compile_fix" ? "fix-compile" : "compile", files,
  });
  if ("error" in out) return text(out.error, true);
  await track(userId, name, out.task.id);
  const id = out.task.id;
  const head = "task_id=" + id + " (" + out.task.kind + ", ~" + out.task.tokensEst + " coins held)\n";
  // Cloudflare Quick Tunnel kills requests at 100s (524), so never hold the
  // connection longer than ~90s. The runner posts the final result separately —
  // the agent picks it up with get_task_result. No coins lost on timeout.
  const t = await waitForResult(id, 90000);
  if (!t) return text(head + "Task vanished unexpectedly.", true);
  const tail = (s: string) => (s || "-").slice(-6000);
  if (t.status === "done" || t.status === "failed") {
    await track(userId, name + "_result", id);
    return text(head + "[" + t.status.toUpperCase() + "] " + t.title + " (charged " + t.tokensCharged + " coins)\n--- log ---\n" + tail(t.log) + "\n--- result ---\n" + tail(t.result) + apkLine(t));
  }
  return text(head + "Still " + t.status + " after ~90s — runner ekhono kaj korche (full build e koyek min lage). Dashboard e jete hobe NA: ei agent thekei `get_task_result` tool e {\"task_id\": \"" + id + "\"} pathao, full log+result ekhanei pabe. 1-2 min por abar call koro.");
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
            capabilities: {
              tools: { listChanged: true },
            },
            serverInfo: { name: "codebridge", version: "2.0.0" },
            instructions: "Signup/login required. When calling a tool without auth you will get an approval URL — open it in a browser, login, tick 'Always allow', and Approve. Call auth_check with the req id to get the result.",
          },
        },
      };
    }
  if (m.method === "ping") return { resp: { jsonrpc: "2.0", id, result: {} } };
  if (m.method === "tools/list") return { resp: { jsonrpc: "2.0", id, result: { tools: TOOLS } } };
  if (m.method === "resources/list") return { resp: { jsonrpc: "2.0", id, result: { resources: [] } } };
  if (m.method === "prompts/list") return { resp: { jsonrpc: "2.0", id, result: { prompts: [] } } };
  if (m.method === "tools/call") {
    const p = (m.params || {}) as { name?: string; arguments?: Record<string, unknown> };
    if (!p.name) return { resp: { jsonrpc: "2.0", id, error: { code: -32602, message: "Missing tool name" } } };
    try {
      const result = await callTool(req, p.name, p.arguments || {});
      return { resp: { jsonrpc: "2.0", id, result } };
    } catch (e) {
      if (e instanceof Response) throw e; // hard auth failure -> HTTP 401
      throw e;
    }
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
    try {
      const r = await handleOne(req, m);
      if (r.resp) out.push(r.resp);
    } catch (e) {
      if (e instanceof Response) return e; // e.g. invalid Bearer -> 401 JSON
      throw e;
    }
  }
  if (out.length === 0) return new Response(null, { status: 202 });
  const payload = Array.isArray(body) ? out : out[0];
  return NextResponse.json(payload, { headers: { "MCP-Protocol-Version": PROTOCOL } });
}

export async function GET(req: Request) {
  const accept = req.headers.get("accept") || "";
  if (accept.includes("text/event-stream")) {
    // Streamable-HTTP clients open a GET SSE stream first. We have no live
    // stream, so answer with JSON (Notion-style servers do the same) instead
    // of plain text the client cannot parse.
    return NextResponse.json(
      { error: "sse_not_supported", error_description: "Use POST Streamable HTTP on this URL." },
      { status: 405, headers: { Allow: "GET, POST", "MCP-Protocol-Version": PROTOCOL } }
    );
  }
  return NextResponse.json({
    mcp: {
      name: "codebridge",
      version: "2.0.0",
      protocol: PROTOCOL,
      transport: "streamableHttp",
      url: "/api/mcp",
      status: "healthy",
      auth: {
        type: "oauth2+bearer",
        connect: "Add only this URL in your client — a browser login connects it (no key pasting). Manual key: /dashboard/mcp.",
      },
      tools: TOOLS.map((t) => t.name),
    },
  });
}
