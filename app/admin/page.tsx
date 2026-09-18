"use client"; import { useEffect, useState } from "react";
export default function AdminHome(){
  const [d,setD]=useState<any>(null); useEffect(()=>{fetch("/api/admin/overview").then(r=>r.json()).then(setD);},[]);
  if(!d) return <p className="muted">Loading...</p>;
  if(d.error) return <p>Admin only. Login as admin@local.test / admin123 in <a href="/login">/login</a></p>;
  return (<div><div className="grid g3"><div className="card"><div className="muted small">Users</div><div style={{fontSize:28,fontWeight:800}}>{d.users.length}</div></div><div className="card"><div className="muted small">Builds</div><div style={{fontSize:28,fontWeight:800}}>{d.builds.length}</div></div><div className="card"><div className="muted small">Tickets</div><div style={{fontSize:28,fontWeight:800}}>{d.tickets.length}</div></div></div><div className="card" style={{marginTop:12}}><b>Runner (Actions opencode):</b> {d.globalGithub?.configured?<span className="badge ok">token ok</span>:<span className="badge bad">token missing</span>} <a href="/admin/github" className="btn-ghost" style={{marginLeft:8}}>Token</a> <a href="/admin/runner" className="btn-ghost" style={{marginLeft:8}}>Runner setup</a></div></div>);
}
