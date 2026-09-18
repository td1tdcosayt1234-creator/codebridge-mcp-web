import Link from "next/link";
export default function Mcp(){
  return (<div className="prose">
    <div className="page-hero"><h1>MCP Connect — <span className="grad">OpenCode + CodeBridge</span></h1>
    <p>Ei web ekta real MCP server (<code>/api/mcp</code>, Streamable HTTP). OpenCode remote MCP hisabe connect korlei agent auto push + build korte parbe.</p></div>
    <div className="grid g2">
      <div className="card"><h3>1️⃣ Config add koro</h3><p className="muted small">Project er <code>opencode.json</code> e bosao:</p><pre>{`{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "codebridge": {
      "type": "remote",
      "url": "http://localhost:3000/api/mcp",
      "headers": { "Authorization": "Bearer PASTE_MCP_KEY" }
    }
  }
}`}</pre><p className="muted small">Key: <Link href="/dashboard/mcp">/dashboard/mcp</Link> (login must). Deploy korle url domain diye bodlao. <b>Tarpor OpenCode restart must</b> — nahole tool asbe na.</p></div>
      <div className="card"><h3>2️⃣ Agent ke bolo</h3><pre>{`codebridge er push_code diye code owner/repo#main e push koro
tarpor trigger_build, seshe get_build_logs dekhao`}</pre><p className="muted small">Reads (list/status/logs) key charao chole; push/trigger e key lage.</p></div>
    </div>
    <h3>🧰 5 ta tool</h3>
    <div className="card"><table className="tools"><thead><tr><th>Tool</th><th>Input</th><th>Output</th></tr></thead><tbody>
      <tr><td><code>list_repos</code></td><td className="small">—</td><td className="small">repo list (owner/repo)</td></tr>
      <tr><td><code>push_code</code></td><td className="small">repo, branch?, files[{`{path, content}`}], message?</td><td className="small">commit sha list</td></tr>
      <tr><td><code>trigger_build</code></td><td className="small">repo, branch?, workflow? (default build.yml)</td><td className="small">run_id</td></tr>
      <tr><td><code>get_build_status</code></td><td className="small">run_id</td><td className="small">queued/running/success…</td></tr>
      <tr><td><code>get_build_logs</code></td><td className="small">run_id</td><td className="small">build log text</td></tr>
      <tr><td><code>run_task</code></td><td className="small">title, prompt (key lage)</td><td className="small">task_id — Actions e opencode kaj korbe</td></tr>
      <tr><td><code>get_task_result</code></td><td className="small">task_id</td><td className="small">status + log + result</td></tr>
    </tbody></table></div>
    <h3>✅ Check koro kaj kore kina</h3>
    <ul>
      <li>Restart er por agent ke bolo: <i>“codebridge er list_repos diye repo dekhao”</i> — list asle connected.</li>
      <li>Na asle: web server cholche? URL thik? headers e key? <Link href="/docs">docs troubleshooting</Link> dekho.</li>
    </ul>
  </div>);
}
