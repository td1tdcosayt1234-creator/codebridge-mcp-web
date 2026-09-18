# CodeBridge — Web Request → Actions OpenCode → Compile + Fix

User repo chhoy na. Web e request dao → GitHub Actions e chalano OpenCode compile/fix kore → output web e fire ase → user result dekhe.

## Flow
```
web request (/dashboard/tasks, title+prompt+files)
  → task queue → workflow_dispatch (builder repo)
  → Actions: opencode run --auto (code + compile, fail hole AI fix, max 3 retry)
  → POST /api/runner/update → dashboard live output
```

## Token economy
- 1 token ≈ 4 chars. File joto boro toto token.
- Request e prompt+files onujayi hold, seshe log+result size onujayi final charge.
- Free balance: 10,000. Kom thakle `402` — request jabe na.
- Modes: `compile` (only) / `fix-compile` (fail → AI auto fix).

## Quick start (localhost)
```bash
npm install
npm run dev
# open http://localhost:3000
```

Demo admin: `admin@local.test` / `admin123` (prod e bodlao).

## Env
Copy `.env.example` to `.env`:
```
AUTH_SECRET=32chars-min-secret
TOKEN_ENC_KEY=32chars-min-key
```

## Routes
- Public: `/`, `/pricing` (Free $0), `/about`, `/mcp`, `/docs`, `/faq`, `/support`, `/terms`, `/privacy`, `/login`, `/signup`
- User (login must): `/dashboard`, `/dashboard/tasks`, `/dashboard/github` (read-only, admin token status), `/dashboard/mcp`, `/dashboard/builds`, `/dashboard/tokens` (balance), `/dashboard/tracking`, `/dashboard/settings`
- Admin (login + admin, nahole 404): `/admin`, `/admin/runner`, `/admin/github`, `/admin/users`, `/admin/tokens`, `/admin/tracking`, `/admin/mcp-control`, `/admin/content`, `/admin/support`, `/admin/logs`

## Admin setup (must)
1. `/admin/github` — Global GitHub Classic Token (scope `repo` + `workflow`).
2. `/admin/runner` — builder repo (owner/repo) + workflow file + runner token regenerate → builder repo secrets: `WEB_URL` (public URL; localhost e cloud runner pouchay na → self-hosted runner), `RUNNER_TOKEN`, `ANTHROPIC_API_KEY`.
3. Builder repo te `.github/workflows/opencode-task.yml` bosao (ready template `/admin/runner` page e).

## MCP connect (opencode.json)
```json
{
  "mcp": {
    "codebridge": {
      "type": "remote",
      "url": "https://your-domain.com/api/mcp",
      "headers": { "Authorization": "Bearer PASTE_MCP_KEY_FROM_DASHBOARD" }
    }
  }
}
```
Restart opencode after config change. Tools: `list_repos`, `push_code`, `trigger_build`, `get_build_status`, `get_build_logs`, `run_task` (kind+files), `get_task_result`.

## Security
bcrypt passwords, JWT httpOnly cookie, AES-256-GCM vault (tokens never shown full), RBAC user/admin, login-must dashboard, 404 on admin for non-admin, audit tracking.
