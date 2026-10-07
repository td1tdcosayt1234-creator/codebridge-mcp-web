# Security Policy

## Reporting a vulnerability
Open a ticket at `/support` (subject: "Security") with steps to reproduce.
Do NOT open a public GitHub issue for vulnerabilities. We review reports
promptly; please give us reasonable time to fix before disclosing.

## What is protected
- **Auth:** bcrypt password hashes (never plaintext), JWT in httpOnly cookies,
  login lockout (5 fails → 15 min lock), CSRF checks, rate limits.
- **Money (Paddle):** checkout requires login + rate limit; admins need a fresh
  2FA step-up code. Webhooks require a valid HMAC-SHA256 signature
  (`ts:body`), fresh timestamp, per-IP rate limit, `event_id` dedup
  (no double credit), and the paid `price_id` must match the plan.
- **Secrets:** admin/GitHub/AI keys stored AES-256-GCM encrypted, never shown
  in full. `DB_MASTER_KEY` encrypts `data/db.json` at rest.
- **Access control:** dashboards require login; admin pages return 404 for
  non-admins; audit events logged for logins, billing, and admin actions.
- **Headers:** CSP, HSTS, `X-Frame-Options: DENY`, nosniff, strict referrer
  policy (see `next.config.js`).

## Rules for contributors
1. **Never commit secrets.** `.env`, `data/db.json`, logs, and `*.exe` are
   gitignored — keep it that way. API keys live only in `.env` / server env.
2. **Never log secrets.** No `console.log` of keys, tokens, signatures, or
   password hashes. Webhook/customer payloads must be redacted in logs.
3. **Money paths fail closed.** Any billing change must keep: signature verify
   → timestamp check → idempotency → price match, in that order.
4. **Keep auth checks server-side.** Client UI may hide buttons, but every
   `/api/*` route must re-verify session + role itself.
5. **Rotate on exposure.** If a key leaks (repo, chat, screenshot): revoke it
   in the provider dashboard immediately and generate a new one.

## Production checklist (before public deploy)
See README "Production security checklist": strong `AUTH_SECRET` +
`TOKEN_ENC_KEY`, real `ADMIN_PASSWORD`, HTTPS only, `TRUST_PROXY` only behind
a stripping proxy, no static serving of project files, `DB_MASTER_KEY` set
with backups, Paddle live verification complete.
