"use client"; import { useEffect, useState } from "react";
export default function Tokens(){
  const [d,setD]=useState<any>(null); useEffect(()=>{fetch("/api/overview").then(r=>r.json()).then(setD);},[]);
  const u=d?.usage||{mcpCalls:0,githubCalls:0}; const limit=100;
  return (<div><h2>Token Uses</h2><div className="grid g2"><div className="card"><div className="muted small">MCP calls (free limit {limit})</div><div style={{fontSize:28,fontWeight:800}}>{u.mcpCalls}</div><div className="muted small">{Math.min(100,Math.round(u.mcpCalls/limit*100))}% used</div></div><div className="card"><div className="muted small">GitHub API calls</div><div style={{fontSize:28,fontWeight:800}}>{u.githubCalls}</div></div></div><p className="muted small">Upgrade in /pricing for Pro 10k calls.</p></div>);
}
