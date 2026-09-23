import Link from "next/link";
import Reveal from "../../components/Reveal";
export default function About(){
  return (<div className="prose">
    <div className="page-hero" style={{textAlign:"center"}}>
      <div className="kicker" style={{marginBottom:12}}><span className="pulse-dot" />Our story</div>
      <h1>About <span className="grad-anim">CodeBridge</span></h1>
      <p style={{margin:"0 auto"}}>Send a compile request on the web → AI compiles it in the cloud and fixes errors itself → the output comes back here → you read the result. No setup, no infrastructure on your side.</p>
    </div>
    <div className="grid g3" style={{marginBottom:14}}>
      <Reveal><div className="card stat"><b className="stat-num">2</b><span>agent tools</span></div></Reveal>
      <Reveal delay={100}><div className="card stat"><b className="stat-num">10k</b><span>free coins</span></div></Reveal>
      <Reveal delay={200}><div className="card stat"><b className="stat-num">0</b><span>setup needed</span></div></Reveal>
    </div>
    <div className="grid g2">
      <Reveal><div className="card" style={{height:"100%"}}><h3 style={{marginTop:0}}>🎯 The problem</h3><p>Code is written, but compiling it, reading errors, fixing and rebuilding — all manual. Copy-paste + waiting = a slow loop.</p></div></Reveal>
      <Reveal delay={120}><div className="card" style={{height:"100%"}}><h3 style={{marginTop:0}}>💡 The solution</h3><p>Send a request (or let your agent call <code>compile</code>): the cloud runner compiles — and <code>compile_fix</code> repairs failures with AI itself and retries. Output lands back here.</p></div></Reveal>
    </div>
    <h3>🔄 Fully automatic pipeline</h3>
    <div className="card"><pre style={{margin:0}}>web request (you) → task queue → cloud AI compile (+ auto fix) → log/result back to web → dashboard + you</pre></div>
    <h3>👥 Who uses what</h3>
    <ul>
      <li><b>User:</b> sign up → send requests in <Link href="/dashboard/tasks">/dashboard/tasks</Link> → watch live status + output. Earn extra coins by watching ads in <Link href="/dashboard/earn">/dashboard/earn</Link>.</li>
      <li><b>Admin:</b> manages the cloud backend, users, coin balances, requests and support — from a protected admin area (invisible until admin login).</li>
    </ul>
    <h3>🪙 Fair pricing by size</h3>
    <p>1 coin ≈ 4 characters. Bigger files cost more — held on request, finally charged on output size. 10,000 coins free to start.</p>
    <div className="cta"><h2>Try it out</h2><p className="muted">Free plan: 10,000 coins — no card required.</p><div style={{display:"flex",gap:10,justifyContent:"center",marginTop:14,flexWrap:"wrap"}}><Link className="btn" href="/signup">Start free</Link><Link className="btn-ghost" href="/game">🎮 Game Studio</Link><Link className="btn-ghost" href="/docs">Docs</Link></div></div>
  </div>);
}
