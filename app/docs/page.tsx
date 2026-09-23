import Link from "next/link";
import CopyBtn from "../../components/CopyBtn";
export default function Docs(){
  const cfg = `{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "codebridge": {
      "type": "remote",
      "url": "https://your-domain.com/api/mcp",
      "headers": { "Authorization": "Bearer PASTE_KEY_FROM_DASHBOARD" }
    }
  }
}`;
  const task = `Title: compile app.py
Instructions: compile the attached app.py, report errors
Mode: fix-compile + file attached`;
  return (<div className="prose">
    <div className="page-hero" style={{textAlign:"center"}}>
      <div className="kicker" style={{marginBottom:12}}><span className="pulse-dot" />5-minute setup</div>
      <h1>Docs — <span className="grad-anim">from zero to build</span></h1>
      <p style={{margin:"0 auto"}}>Connect once, then every run is automatic: request → AI compiles in the cloud → result comes back. Nothing to install or configure.</p>
    </div>

    <h3>Step 0 — The idea (30 sec)</h3>
    <p>You send a request on the web → the cloud runner compiles it (and fixes, in fix mode) → logs/status return to the agent + dashboard. No manual steps.</p>

    <h3>Step 1 — Account + coins (user)</h3>
    <ul>
      <li><Link href="/signup">Sign up</Link> (free, no card) → <Link href="/login">log in</Link>. Free balance: <b>10,000 coins</b> (1 coin ≈ 4 chars).</li>
      <li>Out of coins? Earn more by watching ads in <Link href="/dashboard/earn">/dashboard/earn</Link> (+50 per ad, 10/day). Ad blocker and VPN must be off.</li>
      <li>Nothing else to configure — no tokens, no keys, no setup.</li>
      <li>The dashboard requires login; admin pages show 404 without admin login.</li>
    </ul>

    <h3>Step 2 — Connect your agent (optional)</h3>
    <p>Signup/login is required to use the agent tools. Copy your personal key from <Link href="/dashboard/mcp">/dashboard/mcp</Link>, add it to your project <code>opencode.json</code>, then restart the agent app:</p>
    <div className="codeblock"><div className="codeblock-bar"><span>opencode.json</span><CopyBtn text={cfg} /></div><pre>{cfg}</pre></div>
    <p className="muted small">Full guide: <Link href="/mcp">/mcp</Link>.</p>

    <h3>Step 3 — Send a request: compile / fix-with-compile</h3>
    <p>In <Link href="/dashboard/tasks">/dashboard/tasks</Link>, set title + instructions + files (optional, max 200KB), pick a mode:</p>
    <ul>
      <li><b>Compile only</b> — compiles only (all types: Python, Node, Go...).</li>
      <li><b>Fix with compile</b> — on failure, the AI fixes it itself and retries up to 3 times.</li>
    </ul>
    <p>Bigger files cost more coins: held on request, finally charged on output size. Low balance returns <code>402</code> — then split files into smaller requests.</p>
    <div className="codeblock"><div className="codeblock-bar"><span>request example</span><CopyBtn text={task} /></div><pre>{task}</pre></div>

    <h3>🔧 Agent tools reference</h3>
    <div className="card"><table className="tools"><thead><tr><th>Tool</th><th>What</th><th>Login?</th></tr></thead><tbody>
      <tr><td><code>compile</code></td><td>title, instructions, files[] → compiles all types, waits ~45s for live result</td><td>Yes (website login)</td></tr>
      <tr><td><code>compile_fix</code></td><td>like compile + AI self-fix with retries (fix size costs extra)</td><td>Yes (website login)</td></tr>
    </tbody></table></div>

    <h3>🔐 Security model</h3>
    <ul>
      <li>Passwords: bcrypt hash. Sessions: httpOnly cookies (secure on HTTPS).</li>
      <li>Rate limits everywhere; accounts lock for 15 min after 5 failed logins.</li>
      <li>Anti-bot honeypots on all forms; VPN/proxy blocked on signup and earnings; adblock must be off to earn.</li>
      <li>Secrets encrypted at rest and never shown; every sensitive action is audit-logged.</li>
    </ul>

    <h3>❓ Troubleshooting</h3>
    <ul>
      <li><b>402 / “low balance”</b> → split files smaller or earn coins in /dashboard/earn. History: /dashboard/tokens.</li>
      <li><b>“Bot detected”</b> → you tripped the bot trap; fill the form normally in a real browser.</li>
      <li><b>“VPN/Proxy not allowed”</b> → disable VPN/proxy and retry.</li>
      <li><b>Agent shows no tools</b> → restart the agent app after config change; check the server URL and website login.</li>
      <li>Still stuck? Open a <Link href="/support">support ticket</Link> or read the <Link href="/faq">FAQ</Link>.</li>
    </ul>
  </div>);
}
