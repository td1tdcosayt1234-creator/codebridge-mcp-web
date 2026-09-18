import { NextResponse } from "next/server";
import { readDb, writeDb, uid } from "@/lib/db";
import { decToken } from "@/lib/crypto";
import { effectiveGithubToken } from "@/lib/github-effective";

export const dynamic = "force-dynamic";
const PROTOCOL = "2025-06-18";

const TOOLS = [
  {
    name: "list_repos",
    description: "List GitHub repos visible to the configured (admin global or user) token.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "push_code",
    description: "Push files to a GitHub repo branch (creates/updates files). Needs MCP key from /dashboard/mcp.",
    inputSchema: {
      type: "object",
      properties: {
        repo: { type: "string", description: "owner/repo" },
        branch: { type: "string", description: "branch, default main" },
        message: { type: "string", description: "commit message" },
        files: {
          type: "array",
          items: {
            type: "object",
            properties: { path: { type: "string" }, content: { type: "string" } },
            required: ["path", "content"],
          },
        },
      },
      required: ["repo", "files"],
    },
  },
  {
    name: "trigger_build",
    description: "Dispatch GitHub Actions workflow_dispatch (default build.yml) for a repo branch.",
    inputSchema: {
      type: "object",
      properties: {
        repo: { type: "string", description: "owner/repo" },
        branch: { type: "string", description: "default main" },
        workflow: { type: "string", description: "workflow file, default build.yml" },
      },
      required: ["repo"],
    },
  },
  {
    name: "get_build_status",
    description: "Get status of a triggered build by run_id.",
    inputSchema: { type: "object", properties: { run_id: { type: "string" } }, required: ["run_id"] },
  },
  {
    name: "get_build_logs",
    description: "Get logs of a triggered build by run_id.",
    inputSchema: { type: "object", properties: { run_id: { type: "string" } }, required: ["run_id"] },
  },
  {
    name: "run_task",
    description: "Send a compile/fix request to web: GitHub Actions e opencode run kore kaj korbe. File joto boro toto token katbe. Needs MCP key.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "short title" },
        prompt: { type: "string", description: "exactly what opencode should do (code + compile)" },
        kind: { type: "string", description: "compile or fix-compile (auto AI fix on fail). default compile" },
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
    name: "get_task_result",
    description: "Get output/result of a run_task by task_id.",
    inputSchema: { type: "object", properties: { task_id: { type: "string" } }, required: ["task_id"] },
  },
];

type RpcMsg = { jsonrpc?: string; id?: string | number | null; method?: string; params?: Record<string, unknown> };

function ok(id: string | number | null, result: unknown) {
  return NextResponse.json(
    { jsonrpc: "2.0", id, result },
    { headers: { "MCP-Protocol-Version": PROTOCOL } }
  );
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

async function userIdFrom(req: Request): Promise<string | null> {
  const h = req.headers.get("authorization") || "";
  const key = h.toLowerCase().startsWith("bearer ") ? h.slice(7).trim() : "";
  if (!key) return null;
  const db = await readDb();
  return db.mcpKeys.find((k) => k.key === key)?.userId || null;
}

async function track(userId: string | null, tool: string, detail: string) {
  if (!userId) return;
  try {
    const db = await readDb();
    const us = db.usage.find((u) => u.userId === userId);
    if (us) us.mcpCalls += 1;
    db.events.push({ id: uid("e"), userId, action: "mcp_tool_call", detail: tool + " " + detail, at: new Date().toISOString() });
    await writeDb(db);
  } catch { /* best effort */ }
}

async function callTool(req: Request, name: string, args: Record<string, unknown>) {
  const userId = await userIdFrom(req);
  const db = await readDb();
  if (name === "run_task" || name === "get_task_result") {
    if (!userId) return text("Auth lagbe: /dashboard/mcp theke MCP key niye Authorization: Bearer KEY header e pathao.", true);
    if (name === "run_task") {
      const { createTaskAndDispatch } = await import("@/lib/tasks");
      const files = Array.isArray(args.files) ? (args.files as { path: string; content: string }[]) : [];
      const out = await createTaskAndDispatch(userId, String(args.title || ""), String(args.prompt || ""), {
        kind: args.kind === "fix-compile" ? "fix-compile" : "compile", files,
      });
      if ("error" in out) return text(out.error, true);
      await track(userId, name, out.task.id);
      return text("Request geche ✅ task_id=" + out.task.id + " (" + out.task.kind + ", charge ~" + out.task.tokensEst + " tokens). Actions e opencode kaj kore output dibe — get_task_result diye dekho.");
    }
    const t = db.tasks.find((x) => x.id === String(args.task_id || ""));
    if (!t || t.userId !== userId) return text("task painai: " + String(args.task_id || ""), true);
    await track(userId, name, t.id);
    return text("[" + t.status + "] " + t.title + " (" + t.kind + ", charged " + t.tokensCharged + " tokens)\n--- log ---\n" + (t.log || "—") + "\n--- result ---\n" + (t.result || "— ekhono asenai"));
  }
  const writes = name === "push_code" || name === "trigger_build";
  if (writes && !userId) {
    return text("Auth lagbe: /dashboard/mcp theke MCP key niye Authorization: Bearer KEY header e pathao.", true);
  }
  const eff = userId ? effectiveGithubToken(db, userId) : { token: db.globalGithub?.enc ? decToken(db.globalGithub.enc) : "", source: db.globalGithub?.enc ? ("global" as const) : null };
  if ((name === "list_repos" || writes) && !eff.token) {
    return text("GitHub token set nai. Admin ke /admin/github theke global Classic Token set korte bolo.", true);
  }
  try {
    const { Octokit } = await import("octokit");
    if (name === "list_repos") {
      const oct = new Octokit({ auth: eff.token });
      const r = await oct.request("GET /user/repos", { per_page: 30, affiliation: "owner" });
      const names = (r.data as { full_name: string }[]).map((x) => x.full_name);
      await track(userId, name, names.length + " repos");
      return text(names.length ? names.join("\n") : "Kono repo painai.");
    }
    if (name === "push_code") {
      const repo = String(args.repo || "");
      const branch = String(args.branch || "main");
      const files = (args.files as { path: string; content: string }[]) || [];
      const message = String(args.message || "CodeBridge MCP push");
      if (!repo.includes("/") || files.length === 0) return text("repo (owner/repo) + files[{path,content}] lagbe.", true);
      const [owner, repoName] = repo.split("/");
      const oct = new Octokit({ auth: eff.token });
      const done: string[] = [];
      for (const f of files) {
        let sha: string | undefined;
        try {
          const cur = await oct.request("GET /repos/{owner}/{repo}/contents/{path}", { owner, repo: repoName, path: f.path, ref: branch });
          const d = cur.data as { sha?: string };
          if (!Array.isArray(d) && d.sha) sha = d.sha;
        } catch { /* new file */ }
        const put = await oct.request("PUT /repos/{owner}/{repo}/contents/{path}", {
          owner, repo: repoName, path: f.path, message, branch,
          content: Buffer.from(f.content, "utf8").toString("base64"), ...(sha ? { sha } : {}),
        });
        const pd = put.data as { commit?: { sha?: string } };
        done.push(f.path + "@" + (pd.commit?.sha || "?").slice(0, 7));
      }
      await track(userId, name, repo + "#" + branch + " " + done.length + " files");
      return text("Pushed to " + repo + "#" + branch + " (" + eff.source + " token):\n" + done.join("\n"));
    }
    if (name === "trigger_build") {
      const repo = String(args.repo || "");
      const branch = String(args.branch || "main");
      const workflow = String(args.workflow || "build.yml");
      if (!repo.includes("/")) return text("repo (owner/repo) lagbe.", true);
      const [owner, repoName] = repo.split("/");
      const oct = new Octokit({ auth: eff.token });
      await oct.request("POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches", {
        owner, repo: repoName, workflow_id: workflow, ref: branch,
      });
      const b = { id: uid("run"), userId: userId || "mcp_anon", repo, branch, status: "queued", log: "Triggered via MCP (" + eff.source + " token). Workflow: " + workflow + "#" + branch + ".", at: new Date().toISOString() };
      db.builds.push(b);
      await writeDb(db);
      await track(userId, name, repo + "#" + branch);
      return text("Build dispatched: " + workflow + " on " + repo + "#" + branch + ". run_id=" + b.id + " (get_build_status diye dekho)");
    }
    if (name === "get_build_status" || name === "get_build_logs") {
      const runId = String(args.run_id || "");
      const b = db.builds.find((x) => x.id === runId);
      if (!b) return text("run_id painai: " + runId, true);
      await track(userId, name, runId);
      return text(name === "get_build_status" ? b.repo + "#" + b.branch + " status=" + b.status + " at=" + b.at : b.log);
    }
    return text("Unknown tool: " + name, true);
  } catch (e) {
    return text("GitHub error: " + (e as Error).message, true);
  }
}

async function handleOne(req: Request, m: RpcMsg): Promise<{ resp: object | null }> {
  if (!m || m.jsonrpc !== "2.0" || typeof m.method !== "string") {
    return { resp: { jsonrpc: "2.0", id: (m && m.id) ?? null, error: { code: -32600, message: "Invalid Request" } } };
  }
  const isNotif = m.id === undefined || m.id === null;
  if (isNotif) return { resp: null }; // notifications/initialized -> 202 empty
  const id = m.id as string | number;
  if (m.method === "initialize") {
    return {
      resp: {
        jsonrpc: "2.0", id,
        result: {
          protocolVersion: PROTOCOL,
          capabilities: { tools: {} },
          serverInfo: { name: "codebridge", version: "1.0.0" },
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
    return new Response("SSE stream supported na — POST Streamable HTTP use koro.", { status: 405 });
  }
  return NextResponse.json({
    mcp: { name: "codebridge", protocol: PROTOCOL, url: "/api/mcp", tools: TOOLS.map((t) => t.name) },
  });
}
