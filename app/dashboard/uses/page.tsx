"use client"; import { useEffect, useState } from "react";
export default function Uses(){
  const [d,setD]=useState<any>(null); const [me,setMe]=useState<any>(null);
  useEffect(()=>{fetch("/api/overview").then(r=>r.json()).then(setD);},[]);
  useEffect(()=>{fetch("/api/auth/me").then(r=>r.json()).then(setMe).catch(()=>{});},[]);
  if(!d) return <p className="muted">Loading...</p>;
  if(d.error) return <p>Auth needed. <a href="/login">Login</a></p>;
  const u=d.usage||{}; const tasks=d.tasks||[]; const byDay=d.byDay||{}; const stats=d.stats||{};
  const plan=me?.user?.plan||"free";
  const done=tasks.filter((t:any)=>t.status==="done").length;
  const days=Object.keys(byDay).sort().slice(-14);
  const max=Math.max(1,...days.map(k=>byDay[k]));
  return (<div>
    <div className="kicker"><span className="pulse-dot" />Your consumption</div>
    <h2 style={{margin:"0 0 4px"}}>Uses — <span className="grad-anim">coins, calls & requests</span></h2>
    <p className="muted small" style={{marginTop:0}}>Plan: <span className="badge ok" style={{textTransform:"capitalize"}}>{plan}</span></p>
    <div className="grid g3" style={{margin:"12px 0"}}>
      <div className="card card-glow"><div className="muted small">🪙 Balance</div><div style={{fontSize:28,fontWeight:800}}>{u.balance??0}</div><div className="muted small">used total: {u.usedTotal??0}</div></div>
      <div className="card"><div className="muted small">🔌 MCP calls</div><div style={{fontSize:28,fontWeight:800}}>{u.mcpCalls??0}</div><div className="muted small">GitHub calls: {u.githubCalls??0}</div></div>
      <div className="card"><div className="muted small">📨 Requests</div><div style={{fontSize:28,fontWeight:800}}>{tasks.length}</div><div className="muted small">done: {done}</div></div>
    </div>
    <div className="card" style={{marginBottom:12}}><div className="muted small" style={{marginBottom:8}}>📊 Last 14 days activity</div>
      {days.length===0&&<p className="muted small" style={{margin:0}}>No activity yet.</p>}
      <div style={{display:"flex",gap:6,alignItems:"end",minHeight:70}}>
        {days.map(k=>(<div key={k} style={{flex:1,textAlign:"center"}} title={k+": "+byDay[k]}>
          <div style={{fontSize:10,fontWeight:800}}>{byDay[k]}</div>
          <div style={{height:Math.max(6,Math.round(byDay[k]/max*56)),borderRadius:"6px 6px 2px 2px",background:"linear-gradient(180deg,#22d3ee,#6c8cff)",boxShadow:"0 0 12px -2px #22d3ee88"}} />
          <div style={{fontSize:9,opacity:.55,marginTop:3}}>{k.slice(5)}</div>
        </div>))}
      </div>
    </div>
    <div className="grid g3" style={{marginBottom:12}}>
      {Object.entries(stats).map(([k,v]:any)=>(<div key={k} className="card stat"><b>{v}</b><span>{k}</span></div>))}
      {Object.keys(stats).length===0&&<p className="muted small">No activity yet.</p>}
    </div>
    <div className="card"><h3 style={{marginTop:0}}>Per-request charges</h3>
      {(tasks||[]).map((t:any)=>(<div key={t.id} className="small" style={{borderBottom:"1px solid #ffffff12",padding:"6px 0"}}><span className="badge">{t.status}</span> {t.title} — <b>{t.tokensCharged||0}</b> tokens <span className="muted">({t.kind})</span></div>))}
      {tasks.length===0&&<p className="muted small">Ekhono request nai.</p>}
    </div>
    {plan==="free"&&<p style={{marginTop:12}}><a className="btn" href="/pricing">Upgrade →</a></p>}
  </div>);
}
