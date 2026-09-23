import Link from "next/link";
import Reveal from "../../components/Reveal";
const plans=[
  {name:"Free",icon:"🌱",price:"$0",per:"forever",c:"Perfect for starting",f:["10,000 compile tokens free","Bigger files cost more (1 token ≈ 4 chars)","Fix-with-compile (AI auto-fix)","Dashboard: requests, balance, tracking","Community support"]},
  {name:"Pro",icon:"🚀",price:"$12",per:"/month",c:"For serious builders",f:["200,000 coins / month","Big files + fix-with-compile included","Faster cloud queue","Higher API limits","Priority support"]},
  {name:"Team",icon:"🏢",price:"$39",per:"/month",c:"Team + admin control",f:["1,000,000 tokens / month, shared","Full admin dashboard + audit logs","Per-user balance + quota control","Self-hosted PC runner guide","SLA support"]},
];
export default function Pricing(){ return (<div>
  <div className="page-hero" style={{textAlign:"center"}}>
    <div className="kicker" style={{marginBottom:12}}><span className="pulse-dot" />Simple pricing</div>
    <h1>Pricing — <span className="grad-anim">start free</span></h1>
    <p style={{margin:"0 auto"}}>No card. Sign up → send a request → AI compiles + fixes in the cloud.</p>
  </div>
  <div className="grid g3">{plans.map((p,i)=>(
    <Reveal key={p.name} delay={i*100}>
      <div className={"card"+(p.name==="Pro"?" card-glow card-pop":"")} style={{height:"100%"}}>
        {p.name==="Pro"&&<span className="ribbon">★ Most popular</span>}
        <h3 style={{marginTop:0}}>{p.icon} {p.name}</h3>
        <div><span style={{fontSize:38,fontWeight:800,letterSpacing:"-1px"}}>{p.price}</span><span className="muted small"> {p.per}</span></div>
        <div className="muted small">{p.c}</div>
        <ul className="small check">{p.f.map(f=>(<li key={f}>{f}</li>))}</ul>
        <div style={{marginTop:14}}><Link className={p.name==="Free"?"btn-ghost":"btn"} style={{width:"100%",textAlign:"center"}} href="/signup">Choose {p.name}</Link></div>
      </div>
    </Reveal>))}</div>
  <div className="grid g2" style={{marginTop:14}}>
    <Reveal><div className="card" style={{height:"100%"}}><h3>🎁 What is free?</h3><ul className="small check"><li>No credit card, active right after signup</li><li>Nothing to configure — just log in and send requests</li><li>Agent connect + auto compile + dashboard tracking</li></ul></div></Reveal>
    <Reveal delay={120}><div className="card" style={{height:"100%"}}><h3>📈 When to upgrade?</h3><p className="muted small">Out of balance, requests stop — watch it live in /dashboard/tokens. Need Pro/Team? Open a ticket in /support.</p><Link className="btn-ghost" href="/faq">Read FAQ</Link></div></Reveal>
  </div>
</div>); }
