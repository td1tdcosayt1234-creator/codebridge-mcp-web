import Link from "next/link";
import CopyBtn from "../../components/CopyBtn";
export default function Mcp(){
  const opencode = `{\n  "$schema": "https://opencode.ai/config.json",\n  "mcp": {\n    "codebridge": { "type": "remote", "url": "http://localhost:3001/api/mcp", "enabled": true }\n  }\n}`;
  const cursor = `{"mcpServers":{"codebridge":{"url":"http://localhost:3001/api/mcp"}}}`;
  const claude = `{"mcpServers":{"codebridge":{"url":"http://localhost:3001/api/mcp"}}}`;
  const manual = `{\n  "$schema": "https://opencode.ai/config.json",\n  "mcp": {\n    "codebridge": {\n      "type": "remote",\n      "url": "https://your-domain.com/api/mcp",\n      "headers": { "Authorization": "Bearer PASTE_YOUR_KEY_HERE" }\n    }\n  }\n}`;
  const ask = `compile my attached files with codebridge compile\n(or compile_fix to repair errors automatically)`;
  return (<div className="prose">
    <div className="page-hero" style={{textAlign:"center"}}>
      <div className="kicker" style={{marginBottom:12}}><span className="pulse-dot" />6 tools • OAuth + keys</div>
      <h1>Agent Connect — <span className="grad-anim">one click</span></h1>
      <p style={{margin:"0 auto"}}>This web is an MCP server (<code>/api/mcp</code>). <b>Easiest (Notion-style):</b> add only the URL below — your client opens a browser login, you click <b>Connect</b>, done. No key pasting. Prefer manual keys? Copy one from <Link href="/dashboard/mcp">/dashboard/mcp</Link>.</p>
    </div>
    <div className="card card-glow" style={{marginTop:12}}>
      <h3 style={{marginTop:0}}>🔌 Connect your client</h3>
      <div className="step-card"><div className="stepnum">1</div><div style={{flex:1,minWidth:0}}><b>Add the server URL</b> <span className="muted small">(nothing else)</span>
        <div className="codeblock"><div className="codeblock-bar"><span>opencode.json</span><CopyBtn text={opencode} /></div><pre className="small">{"// opencode.json "}{opencode}{"\n\n// Cursor settings.json\n"}{cursor}{"\n\n// Claude Desktop\n"}{claude}</pre></div>
      </div></div>
      <div className="step-card"><div className="stepnum">2</div><div><b>Use any tool once</b><p className="muted small" style={{margin:"6px 0 0"}}>The client opens <code>/api/oauth/authorize</code> in your browser. <b>Signup/login</b>, click <b>Connect</b>, return to the client. Connected forever (revoke anytime in /dashboard/mcp).</p></div></div>
    </div>
    <div className="grid g2">
      <div className="card"><h3 style={{marginTop:0}}>🔑 Manual key <span className="muted small">(headless agents)</span></h3><p className="muted small"><Link href="/signup">Signup</Link> / <Link href="/login">login</Link>, then open <Link href="/dashboard/mcp">/dashboard/mcp</Link> — your personal key is shown there (never share it). Put this in your project <code>opencode.json</code>:</p>
        <div className="codeblock"><div className="codeblock-bar"><span>opencode.json</span><CopyBtn text={manual} /></div><pre>{manual}</pre></div>
        <p className="muted small"><b>Restart the agent app afterwards</b> — otherwise no tools appear. Wrong key? You get a clear <code>invalid_token</code> error — just re-copy the fresh key. Key leaked? Regenerate it in /dashboard/mcp.</p></div>
      <div className="card"><h3 style={{marginTop:0}}>💬 Tell the agent</h3>
        <div className="codeblock"><div className="codeblock-bar"><span>prompt</span><CopyBtn text={ask} /></div><pre>{ask}</pre></div>
        <p className="muted small">Each call waits up to ~45s and returns the live result. Bigger files cost more coins. Use <code>list_tasks</code> to search past tasks and <code>get_task_result</code> to fetch one.</p></div>
    </div>
    <h3>🧰 6 tools</h3>
    <div className="card"><div className="table-wrap" style={{border:0}}><table className="tools"><thead><tr><th>Tool</th><th>Input</th><th>Output</th></tr></thead><tbody>
      <tr><td><code>compile</code></td><td className="small">title, prompt, files?</td><td className="small">live compile result (all types)</td></tr>
      <tr><td><code>compile_fix</code></td><td className="small">title, prompt, files?</td><td className="small">result with AI self-fix + retries</td></tr>
      <tr><td><code>list_tasks</code></td><td className="small">query?, limit?</td><td className="small">search your tasks (newest first)</td></tr>
      <tr><td><code>get_task_result</code></td><td className="small">task_id</td><td className="small">log + result of one task</td></tr>
    </tbody></table></div></div>
    <h3>✅ Verify it works</h3>
    <ul>
      <li>After restart, tell the agent: <i>“compile hello with codebridge compile”</i> — a live result means connected.</li>
      <li>If not: is the web server running? URL correct? Logged in on the website? See <Link href="/docs">docs troubleshooting</Link>.</li>
    </ul>
  </div>);
}
