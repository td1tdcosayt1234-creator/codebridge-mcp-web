import Link from "next/link";
export default function Home(){
  return (<div>
    <div className="hero">
      <div className="kicker">OpenCode • MCP • GitHub Actions • Auto Build</div>
      <h1>Web e request dao,<br/><span className="grad">Actions e opencode kaj korbe</span></h1>
      <p>Tumi repo chhoba na — sudhu web e request diba (jemon “landing page banao + build dao”). Web request ta GitHub Actions e chalano OpenCode ke dibe, opencode code + compile korbe, output abar web e fire asbe, tumi result ekhanei dekhba.</p>
      <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
        <Link className="btn btn-lg" href="/signup">Start free</Link>
        <Link className="btn-ghost btn-lg" href="/mcp">Connect MCP</Link>
        <Link className="btn-ghost btn-lg" href="/docs">Docs dekho</Link>
      </div>
      <div className="flow">
        <div className="fnode"><b>You</b><span>web e request</span></div><div className="farrow">→</div>
        <div className="fnode"><b>Web</b><span>task queue</span></div><div className="farrow">→</div>
        <div className="fnode"><b>Actions</b><span>opencode run</span></div><div className="farrow">→</div>
        <div className="fnode"><b>Output</b><span>web e ferot</span></div><div className="farrow">→</div>
        <div className="fnode"><b>You</b><span>result dekho</span></div>
      </div>
    </div>

    <div className="section">
      <h2>Kivabe kaj kore <span className="grad">(100% auto)</span></h2>
      <p className="sub">Ekbar connect korlei protibar same flow — kono manual git push, kono Actions click na.</p>
      <div className="grid g3">
        <div className="card"><div className="step"><div className="stepnum">1</div><div><h3 style={{margin:"2px 0 6px"}}>Web e request (tumi)</h3><p className="muted small"><Link href="/dashboard/tasks">/dashboard/tasks</Link> e title + prompt likho — repo, git, token kisui lage na. MCP thakle agent ke diyeo <code>run_task</code> korate paro.</p></div></div></div>
        <div className="card"><div className="step"><div className="stepnum">2</div><div><h3 style={{margin:"2px 0 6px"}}>Actions e opencode</h3><p className="muted small">Web builder repo te workflow dispatch dey — Actions runner e <code>opencode run --auto</code> start hoye code + compile kore.</p></div></div></div>
        <div className="card"><div className="step"><div className="stepnum">3</div><div><h3 style={{margin:"2px 0 6px"}}>Output web → tumi</h3><p className="muted small">Opencode er log + result web e fire ase. Dashboard tasks e live status dekho, seshe output pao.</p></div></div></div>
      </div>
    </div>

    <div className="section">
      <h2>Feature <span className="grad">sob ek jaygay</span></h2>
      <p className="sub">Coding agent theke production build — majhkhane jotokkhon lage sob CodeBridge samlabe.</p>
      <div className="grid g3">
        <div className="card"><div className="feat">🔌</div><h3>MCP Bridge</h3><p className="muted small">Real MCP Streamable HTTP server. OpenCode remote MCP hisabe direct connect — 5 ta ready tool: push, trigger, status, logs, repos.</p></div>
        <div className="card"><div className="feat">🤖</div><h3>Auto transport</h3><p className="muted small">Agent er file auto GitHub repo + branch e jabe. Tomar PC te git, token, clone — kisui lagbe na.</p></div>
        <div className="card"><div className="feat">⚙️</div><h3>Auto compile</h3><p className="muted small">GitHub Actions workflow auto dispatch. Install → build → test → artifact, sob cloud runner e.</p></div>
        <div className="card"><div className="feat">📊</div><h3>Tracking</h3><p className="muted small">Ke kokhon ki push/build korlo, token koto use holo — user + admin dashboard e live.</p></div>
        <div className="card"><div className="feat">🔐</div><h3>Security</h3><p className="muted small">bcrypt password, httpOnly JWT cookie, AES-256-GCM token vault, user/admin role, audit log. Token kokhono plain dekha jay na.</p></div>
        <div className="card"><div className="feat">🎛️</div><h3>Admin control</h3><p className="muted small">Global token, user list, quota, MCP on/off, support ticket, security log — sob admin dashboard e.</p></div>
      </div>
    </div>

    <div className="section">
      <div className="grid g3">
        <div className="card stat"><b className="grad">5</b><span>MCP tools ready</span></div>
        <div className="card stat"><b className="grad">100</b><span>Free MCP calls / month</span></div>
        <div className="card stat"><b className="grad">0</b><span>Manual git command lagbe</span></div>
      </div>
    </div>

    <div className="section">
      <h2>Agent ke ki bolba <span className="grad">(example)</span></h2>
      <p className="sub">Copy-paste korlei cholbe — baki kaj agent + CodeBridge + Actions auto korbe.</p>
      <div className="grid g2">
        <div className="card"><h3>Web request example</h3><pre>Title: landing page banao{"\n"}Prompt: Next.js landing page banao, npm run build pass korte hobe</pre></div>
        <div className="card"><h3>Agent example (MCP)</h3><pre>codebridge er run_task diye request pathao, tarpor get_task_result e output dekhao</pre></div>
      </div>
    </div>

    <div className="cta">
      <h2>Free te shuru koro <span className="grad">— card lagbe na</span></h2>
      <p>100 MCP calls/month, dashboard, tracking soho. Pro lagle pore upgrade.</p>
      <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap",marginTop:16}}>
        <Link className="btn btn-lg" href="/signup">Create free account</Link>
        <Link className="btn-ghost btn-lg" href="/pricing">Pricing</Link>
      </div>
    </div>
  </div>);
}
