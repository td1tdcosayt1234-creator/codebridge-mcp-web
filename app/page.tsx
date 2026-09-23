import Link from "next/link";
import Reveal from "../components/Reveal";
import TerminalDemo from "../components/TerminalDemo";

const LANGS = ["Python", "Node.js", "Go", "Rust", "Java", "C++", "TypeScript", "PHP", "Ruby", "Swift"];

export default function Home(){
  const strip = [...LANGS, ...LANGS];
  return (<div>
    <div className="hero">
      <div className="hero-grid">
        <div className="hero-copy">
          <div className="kicker fade-up d1"><span className="pulse-dot" />AI Compile Cloud • Auto Fix • Earn Coins</div>
          <h1 className="fade-up d2">Send a request on the web,<br/><span className="grad-anim">AI compiles it in the cloud</span></h1>
          <p className="fade-up d3">Never touch code infrastructure — just send a request (e.g. “compile my app and fix errors”). Our cloud runner compiles every file type, the AI fixes failures itself, the output comes back here, and you read the result. Bigger files cost more coins.</p>
          <div className="hero-cta fade-up d4">
            <Link className="btn btn-lg" href="/signup">Start free</Link>
            <Link className="btn-ghost btn-lg" href="/mcp">Connect Agent</Link>
            <Link className="btn-ghost btn-lg" href="/docs">Read docs</Link>
          </div>
        </div>
        <div className="fade-up d5"><TerminalDemo /></div>
      </div>
      <div className="flow fade-up d6">
        <div className="fnode"><b>You</b><span>request on web</span></div><div className="farrow">→</div>
        <div className="fnode"><b>Web</b><span>task queue</span></div><div className="farrow">→</div>
        <div className="fnode"><b>Cloud</b><span>AI compiles</span></div><div className="farrow">→</div>
        <div className="fnode"><b>Output</b><span>back to web</span></div><div className="farrow">→</div>
        <div className="fnode"><b>You</b><span>read result</span></div>
      </div>
    </div>

    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">{strip.map((l,i)=>(<span key={i}><b>◆</b> {l}</span>))}</div>
    </div>

    <Reveal>
    <div className="promo-band">
      <div className="promo-inner">
        <div className="promo-art">🕹️</div>
        <div style={{flex:1,minWidth:220}}>
          <div className="kicker"><span className="pulse-dot" />Game Studio — free</div>
          <h2 style={{margin:"0 0 8px",letterSpacing:"-.5px"}}>Describe a game, <span className="grad-anim">play it instantly</span></h2>
          <p className="muted small" style={{margin:0}}>No deploy, no signup walls for trying — type “neon snake” and get a playable single-file HTML game.</p>
        </div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          <Link className="btn btn-lg" href="/game">Play now →</Link>
          <Link className="btn-ghost btn-lg" href="/signup">Get coins</Link>
        </div>
      </div>
    </div>
    </Reveal>

    <div className="section">
      <Reveal><h2>How it works <span className="grad">(100% automatic)</span></h2>
      <p className="sub">Connect once, then the same flow runs every time — no setup, no clicks.</p></Reveal>
      <div className="grid g3">
        <Reveal delay={0}><div className="card"><div className="step"><div className="stepnum">1</div><div><h3 style={{margin:"2px 0 6px"}}>Send a request (you)</h3><p className="muted small"><Link href="/dashboard/tasks">/dashboard/tasks</Link>: title + instructions + files — nothing else needed. With an agent, it can call <code>compile</code> for you.</p></div></div></div></Reveal>
        <Reveal delay={120}><div className="card"><div className="step"><div className="stepnum">2</div><div><h3 style={{margin:"2px 0 6px"}}>AI compiles in the cloud</h3><p className="muted small">The cloud runner starts, compiles any file type, and in fix mode repairs failures itself and retries.</p></div></div></div></Reveal>
        <Reveal delay={240}><div className="card"><div className="step"><div className="stepnum">3</div><div><h3 style={{margin:"2px 0 6px"}}>Output back to you</h3><p className="muted small">Logs + results return to the web. Watch live status on the dashboard, pay coins by size, done.</p></div></div></div></Reveal>
      </div>
    </div>

    <div className="section">
      <Reveal><h2>Everything <span className="grad">in one place</span></h2>
      <p className="sub">From request to compiled result — CodeBridge handles the whole middle.</p></Reveal>
      <div className="grid g3">
        <Reveal delay={0}><div className="card"><div className="feat">🔌</div><h3>Agent connect</h3><p className="muted small">A real MCP server. Signup/login on the website, paste your personal key from <code>/dashboard/mcp</code> into the agent config — 2 tools: <code>compile</code> + <code>compile_fix</code>.</p></div></Reveal>
        <Reveal delay={80}><div className="card"><div className="feat">📨</div><h3>Request, nothing else</h3><p className="muted small">You only send title + instructions + files. No setup, no tokens, no infrastructure on your side.</p></div></Reveal>
        <Reveal delay={160}><div className="card"><div className="feat">⚙️</div><h3>Auto compile (all types)</h3><p className="muted small">The cloud runner compiles Python, Node, Go and more. In fix mode the AI repairs failures itself and retries up to 3 times.</p></div></Reveal>
        <Reveal delay={0}><div className="card"><div className="feat">🪙</div><h3>Coin economy</h3><p className="muted small">Bigger files cost more coins (1 ≈ 4 chars). Held on request, finally charged on output size. Live balance on the dashboard — or earn free coins by watching ads.</p></div></Reveal>
        <Reveal delay={80}><div className="card"><div className="feat">🔐</div><h3>Security</h3><p className="muted small">Encrypted passwords, secure login with lockout, rate limits, anti-bot + anti-VPN + adblock checks, audit tracking. Secrets are never shown.</p></div></Reveal>
        <Reveal delay={160}><div className="card"><div className="feat">🎛️</div><h3>Admin control</h3><p className="muted small">Users, balances, requests, support and security — everything managed from a protected admin area.</p></div></Reveal>
      </div>
    </div>

    <Reveal>
    <div className="section">
      <div className="grid g3">
        <div className="card stat"><b className="grad-anim">2</b><span>Simple agent tools</span></div>
        <div className="card stat"><b className="grad-anim">10k</b><span>Free coins to start</span></div>
        <div className="card stat"><b className="grad-anim">0</b><span>Setup on your side</span></div>
      </div>
    </div>
    </Reveal>

    <div className="section">
      <Reveal><h2>What to send <span className="grad">(examples)</span></h2>
      <p className="sub">Copy-paste works — the AI + cloud do the rest automatically.</p></Reveal>
      <div className="grid g2">
        <Reveal delay={0}><div className="card"><h3>Web request example</h3><pre>Title: compile landing page{"\n"}Instructions: compile the attached app, fix errors if any</pre></div></Reveal>
        <Reveal delay={120}><div className="card"><h3>Agent example</h3><pre>use codebridge compile to compile my files (or compile_fix to auto-fix too)</pre></div></Reveal>
      </div>
    </div>

    <Reveal>
    <div className="cta">
      <h2>Start free <span className="grad">— no card needed</span></h2>
      <p>10,000 coins, dashboard and tracking included. Earn more by watching ads.</p>
      <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap",marginTop:16}}>
        <Link className="btn btn-lg" href="/signup">Create free account</Link>
        <Link className="btn-ghost btn-lg" href="/pricing">Pricing</Link>
      </div>
    </div>
    </Reveal>
  </div>);
}
