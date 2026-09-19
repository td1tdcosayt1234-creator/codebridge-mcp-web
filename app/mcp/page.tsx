import Link from "next/link";
export default function Mcp(){
  const opencode = `{\n  "$schema": "https://opencode.ai/config.json",\n  "mcp": {\n    "codebridge": { "type": "remote", "url": "http://localhost:3001/api/mcp", "enabled": true }\n  }\n}`;
  const cursor = `{"mcpServers":{"codebridge":{"url":"http://localhost:3001/api/mcp","transport":"streamableHttp"}}}`;
  const claude = `{"mcpServers":{"codebridge":{"url":"http://localhost:3001/api/mcp"}}}`;
  return (<div className="prose">
    <div className="page-hero"><h1>Agent Connect — <span className="grad">signup required</span></h1>
    <p>This web is an MCP server (<code>/api/mcp</code>). <b>Easiest:</b> add only the URL below — when the agent first calls a tool it gives you a browser link; open it, signup/login + tick <b>Always allow</b> + Approve, and it never asks again. <b>Alternative</b> (headless agents): copy your personal key from <Link href="/dashboard/mcp">/dashboard/mcp</Link> into headers. Anonymous calls are rejected.</p></div>
    <div className="card" style={{marginTop:12}}><h3>Add to your agent</h3>
      <pre className="small">// opencode.json\n{opencode}\n\n// Cursor settings.json\n{cursor}\n\n// Claude Desktop\n{claude}</pre></div>
    <div className="grid g2">
      <div className="card"><h3>1️⃣ Get your key</h3><p className="muted small"><Link href="/signup">Signup</Link> / <Link href="/login">login</Link>, then open <Link href="/dashboard/mcp">/dashboard/mcp</Link> — your personal key is shown there (never share it). Put this in your project <code>opencode.json</code>:</p><pre>{`{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "codebridge": {
      "type": "remote",
      "url": "https://your-domain.com/api/mcp",
      "headers": { "Authorization": "Bearer PASTE_YOUR_KEY_HERE" }
    }
  }
}`}</pre><p className="muted small"><b>Restart the agent app afterwards</b> — otherwise no tools appear. Key leaked? Regenerate it in /dashboard/mcp.</p></div>
      <div className="card"><h3>2️⃣ Tell the agent</h3><pre>{`compile my attached files with codebridge compile
(or compile_fix to repair errors automatically)`}</pre><p className="muted small">Each call waits up to ~45s and returns the live result. Bigger files cost more coins.</p></div>
    </div>
    <h3>🧰 2 tools</h3>
    <div className="card"><table className="tools"><thead><tr><th>Tool</th><th>Input</th><th>Output</th></tr></thead><tbody>
      <tr><td><code>compile</code></td><td className="small">title, prompt, files?</td><td className="small">live compile result (all types)</td></tr>
      <tr><td><code>compile_fix</code></td><td className="small">title, prompt, files?</td><td className="small">result with AI self-fix + retries</td></tr>
    </tbody></table></div>
    <h3>✅ Verify it works</h3>
    <ul>
      <li>After restart, tell the agent: <i>“compile hello with codebridge compile”</i> — a live result means connected.</li>
      <li>If not: is the web server running? URL correct? Logged in on the website? See <Link href="/docs">docs troubleshooting</Link>.</li>
    </ul>
  </div>);
}
