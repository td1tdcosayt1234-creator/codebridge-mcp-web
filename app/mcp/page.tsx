import Link from "next/link";
import CopyBtn from "../../components/CopyBtn";
import PageHero from "../../components/PageHero";
import Reveal from "../../components/Reveal";

const TOOLS = [
  ["compile", "title, prompt, files?", "live build result (all types)"],
  ["compile_fix", "title, prompt, files?", "result with AI self-fix + retries"],
  ["list_tasks", "query?, limit?", "search your tasks (newest first)"],
  ["get_task_result", "task_id", "log + result of one task"],
  ["auth_check", "req", "pick up a browser-approved result"],
  ["gh_issue_list", "repo", "list repo issues (via shared token)"],
];

export default function Mcp() {
  // NOTE: your-domain.com = wherever this site is deployed.
  // Local dev server? Use http://localhost:3001 instead.
  const originNote = "https://your-domain.com";
  const opencode = `{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "codebridge": { "type": "remote", "url": "${originNote}/api/mcp", "enabled": true }
  }
}`;
  const cursor = `{"mcpServers":{"codebridge":{"url":"${originNote}/api/mcp"}}}`;
  const claude = `{"mcpServers":{"codebridge":{"url":"${originNote}/api/mcp"}}}`;
  const manual = `{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "codebridge": {
      "type": "remote",
      "url": "https://your-domain.com/api/mcp",
      "headers": { "Authorization": "Bearer PASTE_YOUR_KEY_HERE" }
    }
  }
}`;
  const ask = `compile my attached files with codebridge compile
(or compile_fix to repair errors automatically)`;

  return (
    <div className="prose">
      <PageHero
        kicker="4 tools · OAuth + keys"
        title={<>Agent Connect — <span className="grad-anim text-glow">one click</span></>}
        sub={
          <>
            This site is an MCP server (<code>/api/mcp</code>). <strong>Easiest path:</strong> add only the URL below —
            your client opens a browser login, you click <strong>Connect</strong>, done. Prefer keys? Copy one from{" "}
            <Link href="/dashboard/mcp">/dashboard/mcp</Link>.
          </>
        }
      />

      <Reveal variant="scale">
        <div className="card holo">
          <h3>Connect your client</h3>
          <div className="step-card">
            <div className="stepnum">1</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <strong>Add the server URL</strong> <span className="muted small">(nothing else)</span>
              <div className="codeblock">
                <div className="codeblock-bar">
                  <span>opencode.json</span>
                  <CopyBtn text={opencode} />
                </div>
                <pre className="small">
                  {"// opencode.json "}
                  {opencode}
                  {"\n\n// Cursor settings.json\n"}
                  {cursor}
                  {"\n\n// Claude Desktop\n"}
                  {claude}
                </pre>
              </div>
            </div>
          </div>
          <div className="step-card">
            <div className="stepnum">2</div>
            <div>
              <strong>Use any tool once</strong>
              <p className="muted small" style={{ margin: "8px 0 0" }}>
                The client opens <code>/api/oauth/authorize</code> in your browser. Signup/login, click{" "}
                <strong>Connect</strong>, return to the client. Connected until you revoke it in /dashboard/mcp.
              </p>
            </div>
          </div>
        </div>
      </Reveal>

      <div className="grid g2" style={{ marginTop: 18 }}>
        <Reveal variant="left">
          <div className="card" style={{ height: "100%" }}>
            <h3>Manual key <span className="muted small">(headless agents)</span></h3>
            <p className="muted small">
              <Link href="/signup">Signup</Link> / <Link href="/login">login</Link>, then open{" "}
              <Link href="/dashboard/mcp">/dashboard/mcp</Link> — your personal key is shown there (never share it). Put
              it in your project <code>opencode.json</code>:
            </p>
            <div className="codeblock">
              <div className="codeblock-bar">
                <span>opencode.json</span>
                <CopyBtn text={manual} />
              </div>
              <pre>{manual}</pre>
            </div>
            <p className="muted small">
              <strong>Restart the agent afterwards</strong> — otherwise no tools appear. Wrong key? You get a clear{" "}
              <code>invalid_token</code> error. Key leaked? Regenerate it in /dashboard/mcp.
            </p>
          </div>
        </Reveal>
        <Reveal variant="right" delay={110}>
          <div className="card" style={{ height: "100%" }}>
            <h3>Tell the agent</h3>
            <div className="codeblock">
              <div className="codeblock-bar">
                <span>prompt</span>
                <CopyBtn text={ask} />
              </div>
              <pre>{ask}</pre>
            </div>
            <p className="muted small">
              Each call waits for the live result and returns logs plus artifacts. Bigger files cost more coins. Use{" "}
              <code>list_tasks</code> to search past tasks and <code>get_task_result</code> to fetch one.
            </p>
          </div>
        </Reveal>
      </div>

      <Reveal variant="left">
        <h3>Tools</h3>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="table-wrap" style={{ border: 0 }}>
            <table className="tools">
              <thead>
                <tr>
                  <th>Tool</th>
                  <th>Input</th>
                  <th>Output</th>
                </tr>
              </thead>
              <tbody>
                {TOOLS.map(([name, input, output]) => (
                  <tr key={name}>
                    <td><code>{name}</code></td>
                    <td className="small">{input}</td>
                    <td className="small">{output}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Reveal>

      <Reveal variant="left">
        <h3>Verify it works</h3>
        <ul className="check">
          <li>After restart, tell the agent: <em>&ldquo;compile hello with codebridge compile&rdquo;</em> — a live result means connected.</li>
          <li>If not: is the web server running? URL correct? Logged in on the website? See <Link href="/docs">docs troubleshooting</Link>.</li>
        </ul>
      </Reveal>
    </div>
  );
}
