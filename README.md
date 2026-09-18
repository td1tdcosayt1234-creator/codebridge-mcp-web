# CodeBridge — OpenCode MCP to GitHub Build Pipeline

Connect OpenCode coding agent via MCP, transport code to GitHub with Classic Token, trigger GitHub Actions, track builds.

## Flow
OpenCode -> MCP tool (`/api/mcp`) -> Web -> GitHub push -> Actions run -> log/artifact -> dashboard

## Quick start (localhost)
```bash
npm install
npm run dev
# open http://localhost:3000
```

Demo admin: `admin@local.test` / `admin123` (change in prod via DB + env).

## Env
Copy `.env.example` to `.env`:
```
AUTH_SECRET=32chars-min-secret
TOKEN_ENC_KEY=32chars-min-key
```

## Routes
- Public: `/`, `/pricing` (Free $0), `/about`, `/mcp`, `/docs`, `/faq`, `/support`, `/terms`, `/privacy`, `/login`, `/signup`
- User: `/dashboard`, `/dashboard/github`, `/dashboard/mcp`, `/dashboard/builds`, `/dashboard/tokens`, `/dashboard/tracking`, `/dashboard/settings`
- Admin: `/admin`, `/admin/users`, `/admin/tokens`, `/admin/tracking`, `/admin/mcp-control`, `/admin/content`, `/admin/support`, `/admin/logs`

## GitHub Classic Token
GitHub > Settings > Developer settings > Personal access tokens (classic) > scopes `repo`, `workflow` > paste in `/dashboard/github`. Stored AES-256-GCM encrypted, masked in UI.

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
Tools: `list_repos`, `push_code`, `trigger_build`, `get_build_status`, `get_build_logs`.

## Security
bcrypt passwords, JWT httpOnly cookie, AES-256-GCM PAT vault, RBAC user/admin, audit tracking.
