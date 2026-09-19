"use client"; import { useEffect, useState } from "react";
export default function Builds(){
  const [d,setD]=useState<any>(null);
  useEffect(()=>{fetch("/api/overview").then(r=>r.json()).then(setD);},[]);
  if(!d) return <p className="muted">Loading... <a href="/login">Login</a></p>;
  if(d.error) return <p>Auth needed. <a href="/login">Login</a></p>;
  const builds=d.builds||[]; const tasks=d.tasks||[];
  return (<div>
    <h2>Builds — history</h2>
    <p className="muted small">Cloud compile runs. Live output lives in <a href="/dashboard/tasks">Requests</a>.</p>
    <div className="card"><h3>Builds ({builds.length})</h3>
      {builds.length===0&&<p className="muted small">No builds yet. Send a request first.</p>}
      {builds.map((b:any)=>(<div key={b.id} className="small" style={{borderBottom:"1px solid #ffffff12",padding:"6px 0"}}><span className="badge">{b.status}</span> <b>{b.repo}</b> <span className="muted">#{b.branch} • {b.at}</span><pre style={{marginTop:6}}>{b.log||"—"}</pre></div>))}
    </div>
    <div className="card" style={{marginTop:12}}><h3>Compile requests ({tasks.length})</h3>
      {tasks.length===0&&<p className="muted small">No requests yet.</p>}
      {tasks.map((t:any)=>(<div key={t.id} className="small" style={{borderBottom:"1px solid #ffffff12",padding:"6px 0"}}><span className="badge">{t.status}</span> <b>{t.title}</b> <span className="muted">{t.id} • charged {t.tokensCharged||0}{t.runUrl?<> • <a href={t.runUrl} target="_blank" rel="noreferrer">run</a></>:null}</span></div>))}
    </div>
  </div>);
}
