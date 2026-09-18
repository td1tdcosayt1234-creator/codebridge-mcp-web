import Link from "next/link";
export default function Home(){
  return (<div>
    <div className="hero">
      <div className="kicker">AI Compile Cloud • Auto Fix • Earn Coins</div>
      <h1>Send a request on the web,<br/><span className="grad">AI compiles it in the cloud</span></h1>
      <p>Never touch code infrastructure — just send a request (e.g. “compile my app and fix errors”). Our cloud runner compiles every file type, the AI fixes failures itself, the output comes back here, and you read the result. Bigger files cost more coins.</p>
      <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
        <Link className="btn btn-lg" href="/signup">Start free</Link>
        <Link className="btn-ghost btn-lg" href="/mcp">Connect Agent</Link>
        <Link className="btn-ghost btn-lg" href="/docs">Read docs</Link>
      </div>
      <div className="flow">
        <div className="fnode"><b>You</b><span>request on web</span></div><div className="farrow">→</div>
        <div className="fnode"><b>Web</b><span>task queue</span></div><div className="farrow">→</div>
        <div className="fnode"><b>Cloud</b><span>AI compiles</span></div><div className="farrow">→</div>
        <div className="fnode"><b>Output</b><span>back to web</span></div><div className="farrow">→</div>
        <div className="fnode"><b>You</b><span>read result</span></div>
      </div>
    </div>

    <div className="section">
      <h2>How it works <span className="grad">(100% automatic)</span></h2>
      <p className="sub">Connect once, then the same flow runs every time — no setup, no clicks.</p>
      <div className="grid g3">
        <div className="card"><div className="step"><div className="stepnum">1</div><div><h3 style={{margin:"2px 0 6px"}}>Send a request (you)</h3><p className="muted small"><Link href="/dashboard/tasks">/dashboard/tasks</Link>: title + instructions + files — nothing else needed. With an agent, it can call <code>run_task</code> for you.</p></div></div></div>
        <div className="card"><div className="step"><div className="stepnum">2</div><div><h3 style={{margin:"2px 0 6px"}}>AI compiles in the cloud</h3><p className="muted small">The cloud runner starts, compiles any file type, and in fix mode repairs failures itself and retries.</p></div></div></div>
        <div className="card"><div className="step"><div className="stepnum">3</div><div><h3 style={{margin:"2px 0 6px"}}>Output back to you</h3><p className="muted small">Logs + results return to the web. Watch live status on the dashboard, pay coins by size, done.</p></div></div></div>
      </div>
    </div>

    <div className="section">
      <h2>Everything <span className="grad">in one place</span></h2>
      <p className="sub">From request to compiled result — CodeBridge handles the whole middle.</p>
      <div className="grid g3">
        <div className="card"><div className="feat">🔌</div><h3>Agent connect</h3><p className="muted small">A real MCP server. Your coding agent connects in one step — no keys or headers needed, just log in on the website. 2 tools: send request, read result.</p></div>
        <div className="card"><div className="feat">📨</div><h3>Request, nothing else</h3><p className="muted small">You only send title + instructions + files. No setup, no tokens, no infrastructure on your side.</p></div>
        <div className="card"><div className="feat">⚙️</div><h3>Auto compile (all types)</h3><p className="muted small">The cloud runner compiles Python, Node, Go and more. In fix mode the AI repairs failures itself and retries up to 3 times.</p></div>
        <div className="card"><div className="feat">🪙</div><h3>Coin economy</h3><p className="muted small">Bigger files cost more coins (1 ≈ 4 chars). Held on request, finally charged on output size. Live balance on the dashboard — or earn free coins by watching ads.</p></div>
        <div className="card"><div className="feat">🔐</div><h3>Security</h3><p className="muted small">Encrypted passwords, secure login with lockout, rate limits, anti-bot + anti-VPN + adblock checks, audit tracking. Secrets are never shown.</p></div>
        <div className="card"><div className="feat">🎛️</div><h3>Admin control</h3><p className="muted small">Users, balances, requests, support and security — everything managed from a protected admin area.</p></div>
      </div>
    </div>

    <div className="section">
      <div className="grid g3">
        <div className="card stat"><b className="grad">2</b><span>Simple agent tools</span></div>
        <div className="card stat"><b className="grad">10k</b><span>Free coins to start</span></div>
        <div className="card stat"><b className="grad">0</b><span>Setup on your side</span></div>
      </div>
    </div>

    <div className="section">
      <h2>What to send <span className="grad">(examples)</span></h2>
      <p className="sub">Copy-paste works — the AI + cloud do the rest automatically.</p>
      <div className="grid g2">
        <div className="card"><h3>Web request example</h3><pre>Title: compile landing page{"\n"}Instructions: compile the attached app, fix errors if any</pre></div>
        <div className="card"><h3>Agent example</h3><pre>use codebridge run_task to send the request, then get_task_result to show the output</pre></div>
      </div>
    </div>

    <div className="cta">
      <h2>Start free <span className="grad">— no card needed</span></h2>
      <p>10,000 coins, dashboard and tracking included. Earn more by watching ads.</p>
      <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap",marginTop:16}}>
        <Link className="btn btn-lg" href="/signup">Create free account</Link>
        <Link className="btn-ghost btn-lg" href="/pricing">Pricing</Link>
      </div>
    </div>
  </div>);
}
