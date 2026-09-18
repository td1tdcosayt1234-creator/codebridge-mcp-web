"use client"; import { useEffect, useState } from "react";
export default function AdminHome(){
  const [d,setD]=useState<any>(null); useEffect(()=>{fetch("/api/admin/overview").then(r=>r.json()).then(setD);},[]);
  if(!d) return <p className="muted">Loading...</p>;
  if(d.error) return <p>Admin only. Login as admin@local.test / admin123 in <a href="/login">/login</a></p>;
  return (<div className="grid g3"><div className="card"><div className="muted small">Users</div><div style={{fontSize:28,fontWeight:800}}>{d.users.length}</div></div><div className="card"><div className="muted small">Builds</div><div style={{fontSize:28,fontWeight:800}}>{d.builds.length}</div></div><div className="card"><div className="muted small">Tickets</div><div style={{fontSize:28,fontWeight:800}}>{d.tickets.length}</div></div></div>);
}
