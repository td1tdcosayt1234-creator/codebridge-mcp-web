"use client"; import { useEffect, useState } from "react";
export default function GithubPage(){
  const [st,setSt]=useState<any>(null);
  useEffect(()=>{fetch("/api/github/token").then(r=>r.json()).then(setSt);},[]);
  if(!st) return <p className="muted">Loading...</p>;
  if(st.error) return <p>Login lagbe. <a href="/login">Login</a></p>;
  return (<div>
    <h2>GitHub — Admin Managed</h2>
    <p className="muted small">User token add/see off. Niche admin je token add korse tar status + repo show hobe. Coding agent connect er jonno <a href="/dashboard/mcp">/dashboard/mcp</a> key use koro.</p>
    <div className="card">
      <div>Tool status: <b>{st.connected?"active (admin token)":"not configured"}</b></div>
      {st.updatedAt&&<div className="muted small">Admin update: {st.updatedAt}</div>}
      {(st.repos||[]).length>0
        ? (st.repos||[]).map((r:string)=>(<div key={r} className="small">• {r}</div>))
        : <p className="muted small">Admin ekhono global token set korenai, ba repo read fail. Admin ke /admin/github set korte bolo.</p>}
    </div>
  </div>);
}
