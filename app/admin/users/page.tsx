"use client"; import { useEffect, useState } from "react";
function useAdmin(){ const [d,setD]=useState<any>(null); const [v,setV]=useState(0); useEffect(()=>{fetch("/api/admin/overview").then(r=>r.json()).then(setD);},[v]); return {d,reload:()=>setV(x=>x+1)}; }
export default function AdminUsersPage(){
  const {d,reload}=useAdmin(); const [busy,setBusy]=useState("");
  if(!d) return <p>Loading</p>; if(d.error) return <p>Admin only</p>;
  const grant=async(u:any,plan:string)=>{
    setBusy(u.id+plan);
    const r=await fetch("/api/admin/grant",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId:u.id,plan})});
    const j=await r.json().catch(()=>({}));
    if(!r.ok) alert(j.error||"Grant failed"); else reload();
    setBusy("");
  };
  return (<div className="card"><h3>Users</h3><p className="muted small">Manual plan grant — fallback while Paddle onboarding pends. Granting Pro/Team also credits that plan&apos;s coins.</p><div className="table-wrap" style={{border:0}}><table><thead><tr><th>Email</th><th>Role</th><th>Plan</th><th>Grant</th><th>Created</th></tr></thead><tbody>{d.users.map((u:any)=>(<tr key={u.id}><td>{u.email}</td><td>{u.role}</td><td><span className="badge ok">{u.plan}</span></td><td className="small" style={{whiteSpace:"nowrap"}}>{["free","pro","team"].map(pl=>(<button key={pl} className="tool" style={{marginRight:4}} disabled={!!busy||u.plan===pl} onClick={()=>grant(u,pl)}>{busy===u.id+pl?"…":pl}</button>))}</td><td className="small">{u.createdAt}</td></tr>))}</tbody></table></div></div>);
}
