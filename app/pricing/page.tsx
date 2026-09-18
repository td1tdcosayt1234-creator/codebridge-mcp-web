import Link from "next/link";
const plans=[
  {name:"Free",price:"$0",per:"forever",c:"Perfect for starting",f:["10,000 compile tokens free","Bigger files cost more (1 token ≈ 4 chars)","Fix-with-compile (AI auto-fix)","Dashboard: requests, balance, tracking","Community support"]},
  {name:"Pro",price:"$12",per:"/month",c:"For serious builders",f:["200,000 coins / month","Big files + fix-with-compile included","Faster cloud queue","Higher API limits","Priority support"]},
  {name:"Team",price:"$39",per:"/month",c:"Team + admin control",f:["1,000,000 tokens / month, shared","Full admin dashboard + audit logs","Per-user balance + quota control","Self-hosted PC runner guide","SLA support"]},
];
export default function Pricing(){ return (<div>
  <div className="page-hero" style={{textAlign:"center"}}><h1>Pricing — <span className="grad">start free</span></h1><p style={{margin:"0 auto"}}>No card. Sign up → send a request → AI compiles + fixes in the cloud.</p></div>
  <div className="grid g3">{plans.map(p=>(<div key={p.name} className="card" style={p.name==="Pro"?{borderColor:"#22d3ee66"}:{}}><h3>{p.name} {p.name==="Pro"&&<span className="badge ok">popular</span>}</h3><div><span style={{fontSize:36,fontWeight:800}}>{p.price}</span><span className="muted small">{p.per}</span></div><div className="muted small">{p.c}</div><ul className="small check">{p.f.map(f=>(<li key={f}>{f}</li>))}</ul><div style={{marginTop:12}}><Link className={p.name==="Free"?"btn":"btn-ghost"} href="/signup">Choose {p.name}</Link></div></div>))}</div>
  <div className="grid g2" style={{marginTop:14}}>
    <div className="card"><h3>What is free?</h3><ul className="small check"><li>No credit card, active right after signup</li><li>Nothing to configure — just log in and send requests</li><li>Agent connect + auto compile + dashboard tracking</li></ul></div>
    <div className="card"><h3>When to upgrade?</h3><p className="muted small">Out of balance, requests stop — watch it live in /dashboard/tokens. Need Pro/Team? Open a ticket in /support.</p><Link className="btn-ghost" href="/faq">Read FAQ</Link></div>
  </div>
</div>); }
