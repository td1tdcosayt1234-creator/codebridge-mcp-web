# Deployment & DNS / Tunnel Setup — full recreate guide

 এখানে live setup পুরো detail: Cloudflare zone, tunnel, DNS, host routing, server, scripts।
 Code change na kore শুধু এটা দেখে নতুন machine/account এ সব ফিরিয়ে আনা যাবে।
 Secrets (API tokens, tunnel tokens, .env keys) repo তে **নেই** — নিচে কোথায় পাবে সেটা লেখা আছে।

---

## 1. Cloudflare account (facts)

| Item | Value |
|---|---|
| Account ID | `0df834268d45d3b6c1ebe48c1d3217a7` |
| Account email | Talhamoyelolo52@gmail.com |
| Zone (site) | `roun.sryze.cc` — **Zone ID `7e885207555b8e7c75feea2f15f5c0f1`** |
| Zone nameservers | `felipe.ns.cloudflare.com`, `katja.ns.cloudflare.com` |
| Zone status | active, Free plan, CNAME flattening off (tunnel CNAME needs no flatten) |
| Other zones (same account) | `elsemail.indevs.in` (`cf67d0e4cd717af49fde53d6bbadd44d`), `elsepay.indevs.in` (`35f49bacf5869deca9312f23cf6c3e99`) |

> **গুরুত্বপূর্ণ:** account এ `srtyz.cc` zone **নেই** — শুধু `sryze.cc` আছে। তাই `roun.srtyz.cc` কখনোই কাজ করবে না; সঠিক domain `roun.sryze.cc`।

**API tokens** (password manager এ রাখো; repo তে কখনো দিও না):
- `cfat_...` — account-scoped token: DNS records edit, zone edit, tunnel read/write। এটাই দিয়ে সব setup করা হয়েছে।
- `cfut_...` — user-scoped token (verify: `GET /user/tokens/verify`)।
- Token verify: `curl -s "https://api.cloudflare.com/client/v4/accounts/<ACCOUNT_ID>/tokens/verify" -H "Authorization: Bearer <TOKEN>"`

## 2. Host layout (final routing map)

| Hostname | কী সerve করে | Origin |
|---|---|---|
| `roun.sryze.cc` | public site only (home, /pricing, /about, /mcp, /docs, /faq, /support, /login, /signup, /game, /docs/game…) | `http://localhost:3001` |
| `dash.roun.sryze.cc` | dashboard: `/`→dashboard, `/tasks`, `/builds`, `/mcp` (key), `/earn`, `/settings`, `/tokens`, `/tracking`, `/uses`, `/github`, `/admin/*` | `http://localhost:3001` |
| `api.roun.sryze.cc` | **শুধু MCP**: `/api/mcp`, `/api/mcp/*`, `/api/oauth/*`, `/.well-known/oauth-*`, `/api/auth/*`, `/login` — বাকি সব 404 | `http://localhost:3001` |
| `codebridge.elsemail.indevs.in` | legacy full app (dashboard সহ) — purano setup | `http://localhost:3001` |
| `elsemail.indevs.in` / `dash.elsemail.indevs.in` | elsemail-service (onno project) | `http://localhost:3000` |

Routing logic: `middleware.ts` (host header দেখে) + Cloudflare ingress (hostname → localhost)।
দুই জায়গাই লাগে — middleware **এবং** tunnel ingress।

Rules (middleware.ts এ):
- main host: `/dashboard/*`, `/admin/*` → 307 `dash.roun.sryze.cc…`; `/api/mcp*`, `/api/oauth*` → 307 `api.roun.sryze.cc…`
- dash host: `/` → rewrite `/dashboard`; `/dashboard/x` → 307 `/x` (clean URL); অন্য path → rewrite `/dashboard<path>`; public pages → 307 main host; `/admin/*` + `/api/*` passthrough
- api host: শুধু MCP/OAuth/auth/`/_next` passthrough, বাকি → 404
- dev/LAN/unknown host: পুরনো full-app layout (`codebridge.elsemail.indevs.in` এ bucket এ পড়ে)

## 3. Tunnels

### 3.1 `roun-codebridge` (dedicated — CodeBridge er jonno)
| Item | Value |
|---|---|
| Tunnel ID | `0546c535-91a6-4752-89c0-e4bed9a2cbd3` |
| Name | `roun-codebridge` |
| config_src | `cloudflare` (remote-managed — ingress API দিয়ে set) |
| Token | `.tunnel-tokens.ps1` → `TUNNEL_TOKEN_ROUN` (gitignored) |
| Ingress (API v2) | `roun.sryze.cc`→`:3001`, `dash.roun.sryze.cc`→`:3001`, `api.roun.sryze.cc`→`:3001`, catch-all `http_status:404` |

> কেন dedicated: shared tunnel (`codebridge-web`) এর ingress config onno automation ba user ba baar baar overwrite korto (v8/v10) — DNS record o delete hoye jeto. Dedicated tunnel e conflict nai.

### 3.2 `codebridge-web` (shared — elsemail project-er)
| Item | Value |
|---|---|
| Tunnel ID | `343eef94-77fb-460a-b5ab-d8b2ab2a278a` |
| Name | `codebridge-web` |
| Token | `.tunnel-tokens.ps1` → `TUNNEL_TOKEN_ELSEMAIL` |
| Ingress | `elsemail.indevs.in`→`:3000`, `dash.elsemail.indevs.in`→`:3000`, `codebridge.elsemail.indevs.in`→`:3001`, `elsepay.indevs.in`→`:3002`, 404 catch-all |
| DNS (elsemail zone) | `codebridge.elsemail.indevs.in` CNAME → `343eef94-…​.cfargotunnel.com` (proxied) — already exists |

### 3.3 `else mail` tunnel: `bd015002-cd03-4475-8415-e92fffe2466d` (elsemail-service-er onno tunnel)

## 4. DNS records (zone `roun.sryze.cc`, account token diye)

| Name | Type | Content | Proxied |
|---|---|---|---|
| `roun.sryze.cc` | CNAME | `0546c535-91a6-4752-89c0-e4bed9a2cbd3.cfargotunnel.com` | yes |
| `dash.roun.sryze.cc` | CNAME | `0546c535-91a6-4752-89c0-e4bed9a2cbd3.cfargotunnel.com` | yes |
| `api.roun.sryze.cc` | CNAME | `0546c535-91a6-4752-89c0-e4bed9a2cbd3.cfargotunnel.com` | yes |

SSL: tunnel CNAME + Cloudflare proxied = universal SSL automatic (extra cert lage na)।

## 5. Server + process layout (this machine)

- Next.js **production** server: `npm run build` → `npx next start -p 3001 -H 0.0.0.0` (prod server logs: `prod-server.log`)
- `cloudflared.exe` lives in repo folder (gitignored) — download: `https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe`
- **cert.pem lage na** — `TUNNEL_TOKEN` env diye `cloudflared tunnel run` choli (token-i puro credentials).
- cloudflared run korte hole **interactive login lage na**; `--token` / `TUNNEL_TOKEN` env use koro.
- Process kill korte hole cloudflared restart **supervisor** kore (`tunnel-supervisor.ps1`) — environment jodi process marine, supervisor automatic restart dey.

## 6. Scripts (kono kichu rewrite korte hobe na)

| File | Kaj |
|---|---|
| `start-tunnels.bat` | দুই tunnel supervisor start (tokens `.tunnel-tokens.ps1` theke) |
| `start-tunnels.ps1` | supervisor launcher (token file read kore) |
| `tunnel-supervisor.ps1` | ekta tunnel-er keep-alive loop (exit hole 3s por restart) |
| `start-codebridge-prod.bat` | prod server + `start-tunnels.ps1` ekshathe |
| `start-codebridge.bat` | dev server (`npm run dev -- -p 3001 -H 0.0.0.0`) |
| `.tunnel-tokens.ps1` | **LOCAL ONLY (gitignored)** — `TUNNEL_TOKEN_ROUN`, `TUNNEL_TOKEN_ELSEMAIL` |

Reboot / fresh setup er pore:
```
1. code pull
2. .env banau (.env.example theke copy) - AUTH_SECRET, TOKEN_ENC_KEY, SITE_URL=https://roun.sryze.cc
3. npm install && npm run build
4. .tunnel-tokens.ps1 banau (tunnel tokens)
5. start-codebridge-prod.bat  (server + tunnels ekshathe)
```

## 7. Recreate from scratch (CF API command log)

```bash
CF=cfat_xxxxxxxxxxxxxxxx            # account token (DNS+zone+tunnel edit)
ACCT=0df834268d45d3b6c1ebe48c1d3217a7
ZONE=7e885207555b8e7c75feea2f15f5c0f1   # roun.sryze.cc
TUNNEL=0546c535-91a6-4752-89c0-e4bed9a2cbd3   # roun-codebridge

# 1) verify token
curl -s "https://api.cloudflare.com/client/v4/accounts/$ACCT/tokens/verify" -H "Authorization: Bearer $CF"

# 2) zone list (ID ber korte)
curl -s "https://api.cloudflare.com/client/v4/zones?name=roun.sryze.cc" -H "Authorization: Bearer $CF"

# 3) dedicated tunnel create (token soho response ashe)
curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCT/cfd_tunnel" \
  -H "Authorization: Bearer $CF" -H "Content-Type: application/json" \
  -d '{"name":"roun-codebridge","config_src":"cloudflare"}'
#    -> result.id = tunnel ID, result.token = tunnel token (.tunnel-tokens.ps1 te rakho)

# 4) tunnel-er ingress (host -> localhost)
curl -s -X PUT "https://api.cloudflare.com/client/v4/accounts/$ACCT/cfd_tunnel/$TUNNEL/configurations" \
  -H "Authorization: Bearer $CF" -H "Content-Type: application/json" \
  -d '{"config":{"ingress":[
    {"service":"http://localhost:3001","hostname":"roun.sryze.cc"},
    {"service":"http://localhost:3001","hostname":"dash.roun.sryze.cc"},
    {"service":"http://localhost:3001","hostname":"api.roun.sryze.cc"},
    {"service":"http_status:404"}
  ],"warp-routing":{"enabled":false}}}'

# 5) DNS CNAME (protiti hostname er jonno alada call)
for N in roun.sryze.cc dash.roun.sryze.cc api.roun.sryze.cc; do
  curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE/dns_records" \
    -H "Authorization: Bearer $CF" -H "Content-Type: application/json" \
    -d "{\"type\":\"CNAME\",\"name\":\"$N\",\"content\":\"$TUNNEL.cfargotunnel.com\",\"ttl\":1,\"proxied\":true}"
done

# 6) tunnel token (run korar jonno) - purono tunnel hole:
curl -s "https://api.cloudflare.com/client/v4/accounts/$ACCT/cfd_tunnel/$TUNNEL/token" -H "Authorization: Bearer $CF"

# 7) tunnel chalu koro (cert.pem lage na!)
export TUNNEL_TOKEN=eyJ...     # .tunnel-tokens.ps1 er value
cloudflared tunnel --no-autoupdate run
```

## 8. App-level settings (domain-aware)

- **Session cookie**: `lib/security.ts` → `cookieDomain()` — `roun.sryze.cc` zone এ login korle `Domain=.roun.sryze.cc` pawa jay (dash/api subdomain e session kaj kore)। Login/signup/logout/2fa — char tai ei function use kore.
- **`.env`**: `SITE_URL=https://roun.sryze.cc` (metadataBase, sitemap, robots), `NEXT_PUBLIC_SITE_URL=https://roun.sryze.cc`, `ADMIN_EMAIL`/`ADMIN_PASSWORD` (first boot; na thakle random admin password build log e ekbar dekhay), `AUTH_SECRET`, `TOKEN_ENC_KEY` (32+ chars), optional `DB_MASTER_KEY` (na dile db plaintext).
- **Paddle webhook**: `https://roun.sryze.cc/api/billing/webhook` (Paddle dashboard notification destination)।
- **MCP OAuth discovery** automatic host-aware: `api.roun.sryze.cc/.well-known/oauth-protected-resource` → `authorization_servers: ["https://api.roun.sryze.cc"]`। `webOrigin()` request host theke origin ber kore — kono hardcode lage na.

## 9. Gotchas (jegulo time nosto korechilo)

1. **`srtyz` vs `sryze`** — zone `sryze.cc`; `srtyz.cc` nei. DNS silent fail kore (HTTP 000 / 502)।
2. **Shared tunnel config overwrite** — onno party/user `codebridge-web` tunnel-er ingress + DNS record baarlo; dedicated tunnel ei problem shesh kore.
3. **Process kill** - shell/environment cloudflared process kill korle tunnel down (502/530). Supervisor loop (`tunnel-supervisor.ps1`) restart dey; scripts diye na chole (`start-tunnels.bat` minimal window e chole).
4. **cert.pem** - `cloudflared tunnel login` (browser) lage na; token-only run chole: `TUNNEL_TOKEN=eyJ... cloudflared tunnel run`. (agu run `--url` + token ekshathe diye fail hoyechilo - `--url` nio na.)
5. **Middleware change hole rebuild** — `npm run build` + server restart na korle purono middleware chole.
6. **Cookie domain** — host-only cookie (default) subdomain e session tare na; `.roun.sryze.cc` domain set kora lagbe (code e already ache)।
7. **`--metrics` flag** — ei flag `tunnel` (parent) level e, `run` subcommand e nai — metrics auto port (20241+) ney।
8. **301 vs 307** — redirect gulo 307 (method preserve) — OAuth/POST flow bhange na.

## 10. Quick verify (setup er por)

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://roun.sryze.cc/                # 200
curl -s -o /dev/null -w "%{http_code}\n" https://roun.sryze.cc/dashboard       # 307 -> dash
curl -s -o /dev/null -w "%{http_code}\n" https://dash.roun.sryze.cc/           # 200 (login thakle)
curl -s -o /dev/null -w "%{http_code}\n" https://api.roun.sryze.cc/api/mcp     # 200/401 (MCP live)
curl -s -o /dev/null -w "%{http_code}\n" https://api.roun.sryze.cc/pricing     # 404 (MCP-only host)
curl -s https://api.roun.sryze.cc/.well-known/oauth-protected-resource         # resource metadata JSON
```
