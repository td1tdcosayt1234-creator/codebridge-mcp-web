import Link from "next/link";
const plans=[
  {name:"Free",price:"$0",c:"Perfect to start",f:["100 MCP calls / month","1 GitHub repo","5 Actions builds / month","Community support","Dashboard + tracking"]},
  {name:"Pro",price:"$12/mo",c:"For serious builders",f:["10k MCP calls / month","Unlimited repos","200 builds / month","Artifact downloads","Priority support"]},
  {name:"Team",price:"$39/mo",c:"For teams + admin",f:["Everything in Pro","Admin dashboard","Roles + audit logs","Self-hosted runner guide","SLA support"]},
];
export default function Pricing(){ return (<div style={{padding:"30px 0"}}>
  <h1>Pricing</h1><p className="muted">Start free, upgrade when you ship.</p>
  <div className="grid g3">{plans.map(p=>(<div key={p.name} className="card"><h3>{p.name}</h3><div style={{fontSize:34,fontWeight:800}}>{p.price}</div><div className="muted small">{p.c}</div><ul className="small">{p.f.map(f=>(<li key={f}>{f}</li>))}</ul><Link className={p.name==="Free"?"btn":"btn-ghost"} href="/signup">Choose {p.name}</Link></div>))}</div>
  <div className="card" style={{marginTop:14}}><b>Free plan includes:</b><span className="muted small"> No credit card. Classic Token diye nijer GitHub connect koro, MCP diye OpenCode connect koro.</span></div>
</div>); }
