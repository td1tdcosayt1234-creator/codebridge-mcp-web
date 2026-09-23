# CodeBridge — Web Request → Actions OpenCode → Compile + Fix

User repo chhoy na. Web e request dao → GitHub Actions e chalano OpenCode compile/fix kore → output web e fire ase → user result dekhe.
MCP diye coding agent thekei full output paoa jay — dashboard e jete hoy na.

## Flow
```
web request (/dashboard/tasks, title+prompt+files) ba MCP (compile/compile_fix)
  → task queue → workflow_dispatch (builder repo)
  → Actions: task files task-work/ dir e likhe AI review (Ollama, free, no key)
    + project type onujayi REAL build (Android/Node/Python/Go/Rust)
  → APK thakle POST /api/runner/apk → POST /api/runner/update
  → MCP tool call ei full log+result+APK link (8 min porjonto wait, tarpor get_task_result)
```

## Real build matrix (all types)
Task files isolated `task-work/` dir e lekha hoy — builder repo nijer `package.json` trigger hoy na.
Runner project marker dekhe matching builder চালায়, AI verdict shudhu tokhon override kore jokhon real build fail kore:

| Type | Marker | Real command |
|---|---|---|
| Android | `settings.gradle` / `app/build.gradle` / `AndroidManifest.xml` | `assembleDebug` (Java 17, AGP 8.5.2, Kotlin 1.9.24, compileSdk 34) + APK upload |
| Node | `task-work/package.json` | `npm ci` + `npm run build` (script thakle) |
| Python | `*.py` / `requirements.txt` / `pyproject.toml` | `pip install` + `py_compile` + `pytest` (test thakle) |
| Go | `task-work/go.mod` | `go build ./...` |
| Rust | `task-work/Cargo.toml` | `cargo build` |
| Other | kono marker nei | skip — AI verdict stands |

`.git/.gradle/build/node_modules` junk file server-side filter hoy (quota noshto hoy na, max 50 files / 200KB).
APK flow: GitHub → web (`POST /api/runner/apk`) → agent (`--- apk ---` download link, same Bearer key).

## Token economy
- 1 token ≈ 4 chars. File joto boro toto token.
- Request e prompt+files onujayi hold, seshe log+result size onujayi final charge.
- Final charge cap: total kokhonoi `estimate×3 + 500` er beshi na (infra log bloat e choto test marbe na).
- Dispatch fail hole auto refund (hold ferot, `tokensCharged = 0`).
- Free balance: 10,000. Kom thakle `402` — request jabe na.
- Modes: `compile` (only) / `fix-compile` (fail → AI auto fix, max 3 retry).

## Quick start (localhost)
```bash
npm install
npm run dev -- -p 3001 -H 0.0.0.0
# open http://localhost:3001 (3000 Blockbench use kore, tai 3001)
# ba start-codebridge.bat chalao
```

Demo admin `.env` theke ase (`ADMIN_EMAIL` / `ADMIN_PASSWORD`, min 12 chars).

## Quick start (localhost)
```bash
npm install
npm run dev
# open http://localhost:3000
```

Demo admin `.env` theke ase (`ADMIN_EMAIL` / `ADMIN_PASSWORD`, min 12 chars).

## Access over Tailscale (tailnet)
Bind all interfaces and open the firewall once:
```bash
npm run dev -- -p 3001 -H 0.0.0.0
netsh advfirewall firewall add rule name=CodeBridgeDev dir=in action=allow protocol=TCP localport=3001
```
Then open `http://<tailnet-ip>:3001` from any device on your tailnet (traffic stays inside WireGuard encryption). Login/CSRF work with the tailnet hostname — no code change needed.
**Note:** GitHub cloud runner localhost/tailnet IP te pouchate pare na — `WEB_URL` er jonno public URL (Cloudflare Tunnel) lage, nahole self-hosted runner.

## Env
Copy `.env.example` to `.env`:
```
AUTH_SECRET=32chars-min-secret
TOKEN_ENC_KEY=32chars-min-key
```

## Routes
- Public: `/`, `/pricing` (Free $0), `/about`, `/mcp`, `/docs`, `/faq`, `/support`, `/terms`, `/privacy`, `/login`, `/signup`
- User (login must): `/game` (Game Studio), `/dashboard`, `/dashboard/tasks`, `/dashboard/github` (read-only, admin token status), `/dashboard/mcp`, `/dashboard/builds`, `/dashboard/tokens` (balance), `/dashboard/tracking`, `/dashboard/settings`
- Admin (login + admin, nahole 404): `/admin`, `/admin/runner`, `/admin/github`, `/admin/users`, `/admin/tokens`, `/admin/tracking`, `/admin/mcp-control`, `/admin/content`, `/admin/support`, `/admin/logs`

## Admin setup (must)
1. `/admin/github` — Global GitHub Classic Token (scope `repo` + `workflow`).
2. `/admin/runner` — builder repo (owner/repo) + workflow file + runner token regenerate → builder repo secrets: `WEB_URL` (public URL; localhost e cloud runner pouchay na → Cloudflare Tunnel ba self-hosted runner), `RUNNER_TOKEN`. Kono AI API key lage na — runner free local Ollama (`qwen2.5-coder:1.5b`) use kore.
3. Builder repo te `.github/workflows/opencode-task.yml` bosao (ready template `/admin/runner` page e — sob somoy repo file tai source of truth).

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
Signup/login on the web first, copy the personal key from `/dashboard/mcp` — anonymous calls are rejected.
Restart opencode after config change. Tools: `compile`, `compile_fix`, `list_tasks`, `get_task_result`, `gh_issue_list`, `auth_check` — full log+result+APK link agent ei ase (compile call ~8 min wait, sesh na hole `get_task_result` e `task_id` pathao).

## Security
bcrypt passwords, JWT httpOnly cookie, AES-256-GCM vault (tokens never shown full), RBAC user/admin, login-must dashboard, 404 on admin for non-admin, audit tracking.

## Production security checklist (must before public deploy)
1. **Secrets**: set long random `AUTH_SECRET` + `TOKEN_ENC_KEY` (changing them logs everyone out and wipes saved encrypted tokens — set once, keep safe).
2. **Admin**: set `ADMIN_EMAIL` + `ADMIN_PASSWORD` (min 12 chars) before first boot; never keep `admin123` — the server warns in logs while it is active. Sessions expire after 24h.
3. **TLS**: serve only over HTTPS (reverse proxy). HSTS/CSP/secure-cookie flags only protect real HTTPS traffic; localhost HTTP is dev-only.
4. **Proxy**: set `TRUST_PROXY=true` only behind a proxy that strips client `x-forwarded-for`, otherwise IPs can be spoofed past rate limits.
5. **Files**: never serve the project folder statically — `.env`, `data/db.json` and `.git` must stay off the web (safe with `next start`, dangerous on static hosts).
6. **Limits**: rate limits are in-memory (reset on restart) and login lockout persists in db — for multi-instance scale put a shared store in front.
7. **Database**: set `DB_MASTER_KEY` so `data/db.json` is AES-256-GCM encrypted at rest (auto-migrates on next write; rotating `.bak.1-3` backups kept). Back up the key with the backups — without it data is unrecoverable. Restrict file ACLs to the app user only.
