import Link from "next/link";
export default function Home(){
  return (<div>
    <div className="hero">
      <div className="kicker">OpenCode • MCP • GitHub Actions</div>
      <h1>Connect coding agent,<br/>ship code to <span style={{background:"linear-gradient(90deg,#6c8cff,#22d3ee)",WebkitBackgroundClip:"text",backgroundClip:"text",color:"transparent"}}>GitHub + Build</span></h1>
      <p>CodeBridge is an MCP web bridge: OpenCode calls MCP tools, the web transports code to GitHub with your Classic Token, triggers GitHub Actions, and returns logs, status and artifacts.</p>
      <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
        <Link className="btn" href="/signup">Start free</Link>
        <Link className="btn-ghost" href="/pricing">See pricing</Link>
        <Link className="btn-ghost" href="/mcp">Connect MCP</Link>
      </div>
    </div>
    <div className="grid g3">
      <div className="card"><h3>1. Connect</h3><p className="muted small">Add Classic Token (repo, workflow), get MCP URL + key. Add to opencode.json as remote MCP.</p></div>
      <div className="card"><h3>2. Transport</h3><p className="muted small">Agent calls push_code → backend commits to GitHub branch automatically.</p></div>
      <div className="card"><h3>3. Build</h3><p className="muted small">Workflow dispatches, Actions compiles, logs + artifacts stream back to dashboard.</p></div>
    </div>
    <div className="grid g2" style={{marginTop:14}}>
      <div className="card"><h3>Full pipeline</h3><pre>OpenCode -&gt; MCP tool -&gt; Web -&gt; GitHub push -&gt; Actions run -&gt; log/artifact</pre><p className="muted small">First GitHub Action, then optional self-hosted PC runner.</p></div>
      <div className="card"><h3>Security</h3><p className="muted small">bcrypt passwords, httpOnly JWT cookies, AES-256-GCM PAT vault, RBAC user/admin, audit tracking, rate-limits.</p><Link className="btn-ghost" href="/docs">Read docs</Link></div>
    </div>
  </div>);
}
