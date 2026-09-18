import Link from "next/link";
export default function Mcp(){
  return (<div className="prose">
    <div className="page-hero"><h1>Agent Connect — <span className="grad">no keys needed</span></h1>
    <p>This web is an MCP server (<code>/api/mcp</code>). Add it to your coding agent, stay logged in on the website — done. No headers, no keys, no tokens to paste.</p></div>
    <div className="grid g2">
      <div className="card"><h3>1️⃣ Add the entry</h3><p className="muted small">Put this in your project <code>opencode.json</code>:</p><pre>{`{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "codebridge": {
      "type": "remote",
      "url": "https://your-domain.com/api/mcp"
    }
  }
}`}</pre><p className="muted small"><b>Restart the agent app afterwards</b> — otherwise no tools appear. Keep yourself logged in on the website.</p></div>
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
