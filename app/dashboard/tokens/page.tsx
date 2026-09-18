"use client"; import { useEffect, useState } from "react";
export default function Tokens(){
  const [d,setD]=useState<any>(null); useEffect(()=>{fetch("/api/overview").then(r=>r.json()).then(setD);},[]);
  const u=d?.usage||{mcpCalls:0,githubCalls:0,balance:0,usedTotal:0}; const limit=100;
  return (<div><h2>My Coins</h2>
  <div className="grid g3">
    <div className="card"><div className="muted small">Balance (1 coin = 1 token)</div><div style={{fontSize:28,fontWeight:800}}>{u.balance??0}</div><div className="muted small">compile + fix spend it</div></div>
    <div className="card"><div className="muted small">Total used</div><div style={{fontSize:28,fontWeight:800}}>{u.usedTotal??0}</div><div className="muted small">1 token ≈ 4 chars</div></div>
    <div className="card"><div className="muted small">MCP calls (free {limit})</div><div style={{fontSize:28,fontWeight:800}}>{u.mcpCalls}</div><div className="muted small">API calls: {u.githubCalls}</div></div>
  </div>
  <div className="card" style={{marginTop:12}}><h3>Per-request charge</h3>{(d?.tasks||[]).map((t:any)=>(<div key={t.id} className="small" style={{borderBottom:"1px solid #ffffff12",padding:"6px 0"}}><span className="badge">{t.status}</span> {t.title} — <b>{t.tokensCharged||0}</b> tokens <span className="muted">({t.kind})</span></div>))||<p className="muted small">Ekhono request nai.</p>}</div>
  <p className="muted small">Out of balance, requests stop — split files smaller or go Pro (/pricing). Earn free tokens in <a href="/dashboard/earn">/dashboard/earn</a>.</p></div>);
}
