import Link from "next/link";
import CopyBtn from "../../components/CopyBtn";
import PageHero from "../../components/PageHero";
import Reveal from "../../components/Reveal";

export default function Docs() {
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

  return (
    <div className="prose">
      <PageHero
        kicker="5-minute setup"
        title={<>Docs — <span className="grad-anim">zero to build</span></>}
        sub="Connect once, then every run is automatic: request → real build in the cloud → result back to you. Nothing to install, nothing to configure."
      />

      <Reveal variant="left">
        <h3>Step 0 — The idea (30 sec)</h3>
        <p>You send a request on the web or through your agent → the cloud runner compiles it (and fixes it in fix mode) → logs and status return to the agent and the dashboard. No manual steps.</p>
      </Reveal>

      <Reveal variant="left" delay={50}>
        <h3>Step 1 — Account + coins</h3>
        <ul>
          <li><Link href="/signup">Sign up</Link> (free, no card) → <Link href="/login">log in</Link>. Free balance: <strong>10,000 coins</strong> (1 coin ≈ 4 chars).</li>
          <li>Out of coins? Earn more in <Link href="/dashboard/earn">/dashboard/earn</Link> (+50 per ad, 10/day). Ad blocker and VPN must be off.</li>
          <li>Nothing else to configure — no tokens, no keys, no setup.</li>
          <li>The dashboard requires login; admin pages show 404 without admin login.</li>
        </ul>
      </Reveal>

      <Reveal variant="left" delay={50}>
        <h3>Step 2 — Connect your agent (optional)</h3>
        <p>Signup/login is required to use the agent tools. Copy your personal key from <Link href="/dashboard/mcp">/dashboard/mcp</Link>, add it to your project <code>opencode.json</code>, then restart the agent app:</p>
        <div className="codeblock">
          <div className="codeblock-bar">
            <span>opencode.json</span>
            <CopyBtn text={cfg} />
          </div>
          <pre>{cfg}</pre>
        </div>
        <p className="muted small">Full guide: <Link href="/mcp">/mcp</Link>.</p>
      </Reveal>

      <Reveal variant="left" delay={50}>
        <h3>Step 3 — Send a request</h3>
        <p>In <Link href="/dashboard/tasks">/dashboard/tasks</Link>, set a title, instructions and files (optional, max 200KB), then pick a mode:</p>
        <ul className="check">
          <li><strong>Compile only</strong> — builds every type: Python, Node, Go, Rust, Android and more.</li>
          <li><strong>Fix with compile</strong> — on failure the AI repairs the source itself and retries up to 3 times.</li>
        </ul>
        <p>Bigger files cost more coins: held on request, finally charged on output size. Low balance returns <code>402</code> — then split files into smaller requests.</p>
        <div className="codeblock">
          <div className="codeblock-bar">
            <span>request example</span>
            <CopyBtn text={task} />
          </div>
          <pre>{task}</pre>
        </div>
      </Reveal>

      <Reveal variant="left" delay={50}>
        <h3>Agent tools reference</h3>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="table-wrap" style={{ border: 0 }}>
            <table className="tools">
              <thead>
                <tr>
                  <th>Tool</th>
                  <th>What</th>
                  <th>Login?</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>compile</code></td>
                  <td>title, instructions, files[] → builds all types, waits for the live result</td>
                  <td>Yes (website login)</td>
                </tr>
                <tr>
                  <td><code>compile_fix</code></td>
                  <td>like compile + AI self-fix with retries (fix size costs extra)</td>
                  <td>Yes (website login)</td>
                </tr>
                <tr>
                  <td><code>list_tasks</code></td>
                  <td>query?, limit? → search your tasks</td>
                  <td>Yes</td>
                </tr>
                <tr>
                  <td><code>get_task_result</code></td>
                  <td>task_id → full log + result</td>
                  <td>Yes</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Reveal>

      <Reveal variant="left" delay={50}>
        <h3>Security model</h3>
        <ul className="check">
          <li>Passwords: bcrypt hash. Sessions: httpOnly cookies (secure on HTTPS).</li>
          <li>Rate limits everywhere; accounts lock for 15 min after 5 failed logins.</li>
          <li>Anti-bot honeypots on all forms; VPN/proxy blocked on signup and earnings; adblock must be off to earn.</li>
          <li>Secrets encrypted at rest and never shown; every sensitive action is audit-logged.</li>
        </ul>
      </Reveal>

      <Reveal variant="left" delay={50}>
        <h3>Troubleshooting</h3>
        <ul>
          <li><strong>402 / &ldquo;low balance&rdquo;</strong> → split files smaller or earn coins in /dashboard/earn. History: /dashboard/tokens.</li>
          <li><strong>&ldquo;Bot detected&rdquo;</strong> → you tripped the bot trap; fill the form normally in a real browser.</li>
          <li><strong>&ldquo;VPN/Proxy not allowed&rdquo;</strong> → disable VPN/proxy and retry.</li>
          <li><strong>Agent shows no tools</strong> → restart the agent after the config change; check the server URL and website login.</li>
          <li>Still stuck? Open a <Link href="/support">support ticket</Link> or read the <Link href="/faq">FAQ</Link>.</li>
        </ul>
      </Reveal>
    </div>
  );
}
