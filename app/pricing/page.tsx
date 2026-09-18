import Link from "next/link";
const plans=[
  {name:"Free",price:"$0",per:"forever",c:"Shuru korar jonno perfect",f:["10,000 compile tokens free","File joto boro toto token (1 token ≈ 4 chars)","Fix-with-compile (AI auto fix)","Dashboard: requests, balance, tracking","Community support"]},
  {name:"Pro",price:"$12",per:"/month",c:"Serious builder der jonno",f:["10,000 MCP calls / month","200 builds / month","Artifact downloads","Higher GitHub API limits","Priority support"]},
  {name:"Team",price:"$39",per:"/month",c:"Team + admin control",f:["Pro er sob + unlimited team member","Full admin dashboard + audit logs","Per-user quota control","Self-hosted PC runner guide","SLA support"]},
];
export default function Pricing(){ return (<div>
  <div className="page-hero" style={{textAlign:"center"}}><h1>Pricing — <span className="grad">free te shuru</span></h1><p style={{margin:"0 auto"}}>Card lage na. Signup → OpenCode connect → agent diye auto push + build.</p></div>
  <div className="grid g3">{plans.map(p=>(<div key={p.name} className="card" style={p.name==="Pro"?{borderColor:"#22d3ee66"}:{}}><h3>{p.name} {p.name==="Pro"&&<span className="badge ok">popular</span>}</h3><div><span style={{fontSize:36,fontWeight:800}}>{p.price}</span><span className="muted small">{p.per}</span></div><div className="muted small">{p.c}</div><ul className="small check">{p.f.map(f=>(<li key={f}>{f}</li>))}</ul><div style={{marginTop:12}}><Link className={p.name==="Free"?"btn":"btn-ghost"} href="/signup">Choose {p.name}</Link></div></div>))}</div>
  <div className="grid g2" style={{marginTop:14}}>
    <div className="card"><h3>Free te ki ki paba?</h3><ul className="small check"><li>No credit card, signup korlei active</li><li>GitHub token add kora lage na — admin global token diye chole</li><li>MCP connect + auto compile + dashboard tracking</li></ul></div>
    <div className="card"><h3>Upgrade kokhon?</h3><p className="muted small">Token uses 100% hole ba build limit sesh hole /dashboard/tokens e dekhte parba. Pro/Team lagle /support e ticket kholo — payment add hole ekhan thekei upgrade hobe.</p><Link className="btn-ghost" href="/faq">FAQ poro</Link></div>
  </div>
</div>); }
