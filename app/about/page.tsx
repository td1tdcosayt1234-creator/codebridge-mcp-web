import Link from "next/link";
export default function About(){
  return (<div className="prose">
    <div className="page-hero"><h1>About <span className="grad">CodeBridge</span></h1>
    <p>CodeBridge e user repo chhoy na. Tumi web e request diba → web GitHub Actions e chalano OpenCode ke task dibe → opencode code + compile korbe → output web e fire asbe → tumi result dekhba.</p></div>
    <div className="grid g2">
      <div className="card"><h3>🎯 Problem</h3><p>AI agent code likhe dey, kintu repo te tola, branch banano, Actions run kora, log dekha — sob hate korte hoy. Copy-paste + click + wait = slow loop.</p></div>
      <div className="card"><h3>💡 Solution</h3><p>Agent nije MCP tool call kore: <code>push_code</code> te code GitHub e jabe, <code>trigger_build</code> e Actions compile korbe, <code>get_build_logs</code> e result fire asbe. Tumi sudhu agent ke bolba.</p></div>
    </div>
    <h3>🔄 Full auto pipeline</h3>
    <div className="card"><pre style={{margin:0}}>web request (tumi) → task queue → workflow_dispatch → Actions: opencode run --auto → log/result POST web → dashboard + tumi</pre></div>
    <h3>👥 Kara use korbe</h3>
    <ul>
      <li><b>User:</b> signup → <Link href="/dashboard/tasks">/dashboard/tasks</Link> e request dao → live status + output dekho. Repo/git/token — kisui lage na. MCP thakle agent ke diye <code>run_task</code> o korate paro.</li>
      <li><b>Admin:</b> builder repo + workflow + runner token + global GitHub token set (<Link href="/admin/runner">/admin/runner</Link>), user/quota/task monitor — <Link href="/admin">admin dashboard</Link> theke.</li>
    </ul>
    <h3>🧱 Tech (short)</h3>
    <ul>
      <li>Next.js web + real MCP Streamable HTTP server (<code>/api/mcp</code>)</li>
      <li>GitHub Classic Token vault (AES-256-GCM), Octokit API, workflow_dispatch</li>
      <li>Auth: bcrypt + httpOnly JWT cookie, RBAC user/admin, audit tracking</li>
    </ul>
    <div className="cta"><h2>Try kore dekho</h2><p className="muted">Free plan e 100 MCP calls/month — card lage na.</p><div style={{display:"flex",gap:10,justifyContent:"center",marginTop:14}}><Link className="btn" href="/signup">Start free</Link><Link className="btn-ghost" href="/docs">Docs</Link></div></div>
  </div>);
}
