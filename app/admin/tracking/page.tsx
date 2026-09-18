"use client"; import { useEffect, useState } from "react";
export default function AdminTracking(){
  const [d,setD]=useState<any>(null); const [f,setF]=useState("all"); const [q,setQ]=useState("");
  useEffect(()=>{fetch("/api/admin/overview").then(r=>r.json()).then(setD);},[]);
  if(!d) return <p>Loading</p>; if(d.error) return <p>Admin only</p>;
  const stats:Record<string,number>={}; for(const e of (d.events||[])) stats[e.action]=(stats[e.action]||0)+1;
  const evs=(d.events||[]).filter((e:any)=>(f==="all"||e.action===f)&&(!q||e.userId.includes(q)||(e.detail||"").includes(q)));
  function csv(){
    const rows=["time,user,action,detail",...evs.map((e:any)=>[e.at,e.userId,e.action,JSON.stringify(e.detail||"")].join(","))];
    const a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob([rows.join("\n")],{type:"text/csv"}));
    a.download="admin-tracking.csv"; a.click();
  }
  return (<div>
    <h2>Global tracking</h2>
    <div className="grid g3" style={{marginBottom:12}}>
      {Object.entries(stats).map(([k,v])=>(<div key={k} className="card stat"><b>{v}</b><span>{k}</span></div>))}
    </div>
    <div className="card">
      <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
        <select value={f} onChange={e=>setF(e.target.value)} style={{maxWidth:220}}>
          <option value="all">All actions</option>
          {Object.keys(stats).map(k=>(<option key={k} value={k}>{k}</option>))}
        </select>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search user or detail..." style={{maxWidth:260}}/>
        <button className="btn-ghost" onClick={csv}>Export CSV</button>
      </div>
      <table><thead><tr><th>Time</th><th>User</th><th>Action</th><th>Detail</th></tr></thead><tbody>
        {evs.slice(0,200).map((e:any)=>(<tr key={e.id}><td className="small">{e.at}</td><td className="small">{e.userId}</td><td><span className="badge">{e.action}</span></td><td className="small">{e.detail}</td></tr>))}
      </tbody></table>
    </div></div>);
}
