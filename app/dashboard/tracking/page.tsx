"use client"; import { useEffect, useState } from "react";
export default function Tracking(){
  const [d,setD]=useState<any>(null); const [f,setF]=useState("all");
  useEffect(()=>{fetch("/api/overview").then(r=>r.json()).then(setD);},[]);
  if(!d) return <p className="muted">Loading...</p>;
  if(d.error) return <p>Auth needed. <a href="/login">Login</a></p>;
  const evs=(d.events||[]).filter((e:any)=>f==="all"||e.action===f);
  const stats=d.stats||{}; const u=d.usage||{}; const byDay=d.byDay||{};
  const tasks=d.tasks||[];
  const done=tasks.filter((t:any)=>t.status==="done").length;
  const days=Object.keys(byDay).sort().slice(-14);
  const max=Math.max(1,...days.map(k=>byDay[k]));
  function csv(){
    const rows=["time,action,detail",...evs.map((e:any)=>[e.at,e.action,JSON.stringify(e.detail||"")].join(","))];
    const a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob([rows.join("\n")],{type:"text/csv"}));
    a.download="tracking.csv"; a.click();
  }
  return (<div>
    <div className="kicker"><span className="pulse-dot" />Your activity</div>
    <h2 style={{margin:"0 0 4px"}}>Tracking — <span className="grad-anim">uses & events</span></h2>
    <p className="muted small" style={{marginTop:0}}>Coins, calls, requests — everything you used, plus full event log.</p>
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
    <div className="card">
      <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
        <select value={f} onChange={e=>setF(e.target.value)} style={{maxWidth:240}}>
          <option value="all">All actions</option>
          {Object.keys(stats).map(k=>(<option key={k} value={k}>{k}</option>))}
        </select>
        <button className="btn-ghost" onClick={csv}>Export CSV</button>
      </div>
      <div className="table-wrap" style={{border:0}}><table><thead><tr><th>Time</th><th>Action</th><th>Detail</th></tr></thead><tbody>
        {evs.slice(0,100).map((e:any)=>(<tr key={e.id}><td className="small">{e.at}</td><td><span className="badge">{e.action}</span></td><td className="small">{e.detail}</td></tr>))}
      </tbody></table></div>
    </div></div>);
}
