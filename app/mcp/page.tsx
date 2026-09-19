import Link from "next/link";
export default function Mcp(){
  const opencode = `{\n  "$schema": "https://opencode.ai/config.json",\n  "mcp": {\n    "codebridge": { "type": "remote", "url": "http://localhost:3001/api/mcp", "enabled": true }\n  }\n}`;
  const cursor = `{"mcpServers":{"codebridge":{"url":"http://localhost:3001/api/mcp"}}}`;
  const claude = `{"mcpServers":{"codebridge":{"url":"http://localhost:3001/api/mcp"}}}`;
  return (<div className="prose">
    <div className="page-hero"><h1>Agent Connect — <span className="grad">one click</span></h1>
    <p>This web is an MCP server (<code>/api/mcp</code>). <b>Easiest (Notion-style):</b> add only the URL below — your client opens a browser login, you click <b>Connect</b>, done. No key pasting. Prefer manual keys? Copy one from <Link href="/dashboard/mcp">/dashboard/mcp</Link>.</p></div>
    <div className="card" style={{marginTop:12}}><h3>Connect your client</h3>
      <p className="muted small"><b>1.</b> Add the server URL (nothing else):</p>
      <pre className="small">// opencode.json\n{opencode}\n\n// Cursor settings.json\n{cursor}\n\n// Claude Desktop\n{claude}</pre>
      <p className="muted small"><b>2.</b> Use any tool once — the client opens <code>/api/oauth/authorize</code> in your browser. <b>Signup/login</b>, click <b>Connect</b>, return to the client. Connected forever (revoke anytime in /dashboard/mcp).</p></div>
    <div className="grid g2">
      <div className="card"><h3>Manual key (headless agents)</h3><p className="muted small"><Link href="/signup">Signup</Link> / <Link href="/login">login</Link>, then open <Link href="/dashboard/mcp">/dashboard/mcp</Link> — your personal key is shown there (never share it). Put this in your project <code>opencode.json</code>:</p><pre>{`{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "codebridge": {
      "type": "remote",
      "url": "https://your-domain.com/api/mcp",
      "headers": { "Authorization": "Bearer PASTE_YOUR_KEY_HERE" }
    }
  }
}`}</pre><p className="muted small"><b>Restart the agent app afterwards</b> — otherwise no tools appear. Wrong key? You get a clear <code>invalid_token</code> error — just re-copy the fresh key. Key leaked? Regenerate it in /dashboard/mcp.</p></div>
      <div className="card"><h3>2️⃣ Tell the agent</h3><pre>{`compile my attached files with codebridge compile
(or compile_fix to repair errors automatically)`}</pre><p className="muted small">Each call waits up to ~45s and returns the live result. Bigger files cost more coins. Use <code>list_tasks</code> to search past tasks and <code>get_task_result</code> to fetch one.</p></div>
    </div>
    <h3>🧰 6 tools</h3>
    <div className="card"><table className="tools"><thead><tr><th>Tool</th><th>Input</th><th>Output</th></tr></thead><tbody>
      <tr><td><code>compile</code></td><td className="small">title, prompt, files?</td><td className="small">live compile result (all types)</td></tr>
      <tr><td><code>compile_fix</code></td><td className="small">title, prompt, files?</td><td className="small">result with AI self-fix + retries</td></tr>
      <tr><td><code>list_tasks</code></td><td className="small">query?, limit?</td><td className="small">search your tasks (newest first)</td></tr>
      <tr><td><code>get_task_result</code></td><td className="small">task_id</td><td className="small">log + result of one task</td></tr>
    </tbody></table></div>
    <h3>✅ Verify it works</h3>
    <ul>
      <li>After restart, tell the agent: <i>“compile hello with codebridge compile”</i> — a live result means connected.</li>
      <li>If not: is the web server running? URL correct? Logged in on the website? See <Link href="/docs">docs troubleshooting</Link>.</li>
    </ul>
  </div>);
}
