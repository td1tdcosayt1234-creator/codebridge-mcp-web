"use client"; import { useEffect, useState } from "react";
export default function Tracking(){
  const [d,setD]=useState<any>(null); const [f,setF]=useState("all");
  useEffect(()=>{fetch("/api/overview").then(r=>r.json()).then(setD);},[]);
  if(!d) return <p className="muted">Loading...</p>;
  const evs=(d.events||[]).filter((e:any)=>f==="all"||e.action===f);
  const stats=d.stats||{};
  function csv(){
    const rows=["time,action,detail",...evs.map((e:any)=>[e.at,e.action,JSON.stringify(e.detail||"")].join(","))];
    const a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob([rows.join("\n")],{type:"text/csv"}));
    a.download="tracking.csv"; a.click();
  }
  return (<div><h2>Tracking — everything you do</h2>
    <div className="grid g3" style={{marginBottom:12}}>
      {Object.entries(stats).map(([k,v]:any)=>(<div key={k} className="card stat"><b>{v}</b><span>{k}</span></div>))}
      {Object.keys(stats).length===0&&<p className="muted small">No activity yet.</p>}
    </div>
    <div className="card">
      <div style={{display:"flex",gap:8,marginBottom:10}}>
        <select value={f} onChange={e=>setF(e.target.value)} style={{maxWidth:240}}>
          <option value="all">All actions</option>
          {Object.keys(stats).map(k=>(<option key={k} value={k}>{k}</option>))}
        </select>
        <button className="btn-ghost" onClick={csv}>Export CSV</button>
      </div>
      <table><thead><tr><th>Time</th><th>Action</th><th>Detail</th></tr></thead><tbody>
        {evs.slice(0,100).map((e:any)=>(<tr key={e.id}><td className="small">{e.at}</td><td><span className="badge">{e.action}</span></td><td className="small">{e.detail}</td></tr>))}
      </tbody></table>
    </div></div>);
}
