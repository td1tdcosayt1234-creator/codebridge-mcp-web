"use client"; import { useEffect, useState } from "react";
export default function GithubStatus(){
  const [st,setSt]=useState<any>(null);
  useEffect(()=>{fetch("/api/github/status").then(r=>r.json()).then(setSt);},[]);
  if(!st) return <p className="muted">Loading... <a href="/login">Login</a></p>;
  if(st.error) return <p>Auth needed. <a href="/login">Login</a></p>;
  return (<div>
    <h2>GitHub — read-only status</h2>
    <p className="muted small">You never paste tokens here. The admin sets one global token and the builder repo. This page is read-only.</p>
    <div className="grid g2">
      <div className="card"><div className="muted small">Global GitHub token</div>
        <div style={{marginTop:6}}>{st.configured?<span className="badge ok">configured</span>:<span className="badge bad">not set — ask admin (/admin/github)</span>}</div>
      </div>
      <div className="card"><div className="muted small">Builder repo (Actions runner)</div>
        <div style={{marginTop:6}}><b>{st.builderRepo||"not set"}</b> <span className="muted small">{st.builderWorkflow||""}</span></div>
        <div className="muted small" style={{marginTop:6}}>Requests dispatch a workflow here. Output returns to /dashboard/tasks.</div>
      </div>
    </div>
    <div className="card" style={{marginTop:12}}><a href="/dashboard/tasks" className="btn-ghost">Go to Requests</a> <a href="/dashboard/builds" className="btn-ghost" style={{marginLeft:8}}>Go to Builds</a></div>
  </div>);
}
