import Link from "next/link";
export default function Docs(){
  return (<div className="prose">
    <div className="page-hero"><h1>Docs — <span className="grad">shuru theke build</span></h1>
    <p>5 minute setup. Ekbar connect korlei protibar auto: agent push → GitHub → Actions compile → result. Tomar repo hate dhorte hobe na.</p></div>

    <h3>Step 0 — Concept (30 sec)</h3>
    <p>Tumi OpenCode ke bolo → agent CodeBridge MCP tool call kore → web GitHub e code pathay + Actions build chalay → log/status agent + dashboard e fire ase. Manual git/push/click — kisui nai.</p>

    <h3>Step 1 — Account + MCP key (user)</h3>
    <ul>
      <li><Link href="/signup">Signup</Link> koro (free, card lage na) → <Link href="/login">login</Link>.</li>
      <li><Link href="/dashboard/mcp">/dashboard/mcp</Link> theke tomar MCP key copy koro. Reads (repo list, status, logs) key charao chole; <b>push/trigger e key must</b>.</li>
      <li>GitHub token add kora <b>lage na</b> — admin global token diye sob chole. <Link href="/dashboard/github">/dashboard/github</Link> te admin token er status + repo dekhte parba.</li>
    </ul>

    <h3>Step 2 — OpenCode connect</h3>
    <p>Project er <code>opencode.json</code> e add koro, tarpor OpenCode restart:</p>
    <pre>{`{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "codebridge": {
      "type": "remote",
      "url": "http://localhost:3000/api/mcp",
      "headers": { "Authorization": "Bearer PASTE_MCP_KEY" }
    }
  }
}`}</pre>
    <p className="muted small">Server deploy korle url ta tomar domain (<code>https://tomar-domain.com/api/mcp</code>) diye replace koro. Full guide: <Link href="/mcp">/mcp</Link>.</p>

    <h3>Step 3 — Agent diye auto push + compile</h3>
    <pre>{`codebridge er push_code diye ei code owner/repo#main e push koro,
tarpor trigger_build diye build dao, get_build_logs e result dekhao`}</pre>
    <p>Fail hole agent nije log pore fix kore abar push korte parbe — full loop auto.</p>

    <h3>🔧 Tools reference</h3>
    <div className="card"><table className="tools"><thead><tr><th>Tool</th><th>Kaj</th><th>Key lage?</th></tr></thead><tbody>
      <tr><td><code>list_repos</code></td><td>Token er visible repo list</td><td>Na</td></tr>
      <tr><td><code>push_code</code></td><td>repo, branch, files[{`{path, content}`}] → auto commit</td><td>Ha</td></tr>
      <tr><td><code>trigger_build</code></td><td>repo, branch, workflow (default build.yml) → dispatch</td><td>Ha</td></tr>
      <tr><td><code>get_build_status</code></td><td>run_id → status</td><td>Na</td></tr>
      <tr><td><code>get_build_logs</code></td><td>run_id → log</td><td>Na</td></tr>
    </tbody></table></div>

    <h3>⚙️ Repo te workflow file (target repo te ekbar)</h3>
    <p>Je repo te build hobe, sekhane <code>.github/workflows/build.yml</code> rakho:</p>
    <pre>{`name: build
on:
  workflow_dispatch:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run build`}</pre>

    <h3>🛡️ Admin setup (admin only)</h3>
    <ul>
      <li>GitHub → Settings → Developer settings → Personal access tokens (classic) → scope <code>repo</code> + <code>workflow</code> → token copy.</li>
      <li><Link href="/admin/github">/admin/github</Link> te paste → verify+save. Ekhon thekei tool live.</li>
      <li><Link href="/admin/runner">/admin/runner</Link> te builder repo (owner/repo) + workflow file set koro, runner token regenerate kore builder repo secrets e bosao: <code>WEB_URL</code> (public URL — localhost e GitHub runner pouchate pare na, tokhon PC te self-hosted runner lagbe), <code>RUNNER_TOKEN</code>, <code>ANTHROPIC_API_KEY</code> (opencode er model key).</li>
      <li>Builder repo te <code>.github/workflows/opencode-task.yml</code> file bosao (ready YAML template /admin/runner page e ache): workflow_dispatch → task pull → <code>opencode run --auto</code> → result POST web.</li>
      <li>User/quota/task/support — <Link href="/admin">admin dashboard</Link> theke monitor koro.</li>
    </ul>

    <h3>📨 Request flow (main architecture)</h3>
    <ul>
      <li>User <Link href="/dashboard/tasks">/dashboard/tasks</Link> e title + prompt dey (repo touch kore na) — ba MCP agent <code>run_task</code> call kore.</li>
      <li>Web builder repo te <code>workflow_dispatch</code> dey (input: task_id).</li>
      <li>Actions runner: <code>GET /api/runner/next?task_id=...</code> (Bearer RUNNER_TOKEN) → task ney → <code>opencode run --auto</code> chalay → <code>POST /api/runner/update</code> te log/result pathay.</li>
      <li>User dashboard e live status (queued → running → done/failed) + output dekhe. Agent hole <code>get_task_result</code>.</li>
    </ul>

    <h3>❓ Problem hole</h3>
    <ul>
      <li><b>“GitHub token set nai”</b> → admin global token set korenai. Admin ke bolo.</li>
      <li><b>“Auth lagbe” (push/trigger)</b> → opencode.json er headers e MCP key bosao.</li>
      <li><b>MCP connect hoy na</b> → web server cholche? URL thik? OpenCode restart diso?</li>
      <li>Ar stuck hole <Link href="/support">support ticket</Link> kholo ba <Link href="/faq">FAQ</Link> dekho.</li>
    </ul>
  </div>);
}
