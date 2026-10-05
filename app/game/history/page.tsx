"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type HistItem = { id:string; prompt:string; plan:string; provider:string; model:string; htmlSize:number; summary:string; createdAt:string };

export default function GameHistoryPage(){
  const [items,setItems]=useState<HistItem[]>([]);
  const [loading,setLoading]=useState(true);
  const [msg,setMsg]=useState("");

  const load = async ()=>{
    setLoading(true);
    try{
      const r = await fetch("/api/game/history",{cache:"no-store"});
      if(r.status===401){ location.href="/login?next=/game/history"; return; }
      const j = await r.json().catch(()=>({}));
      if(r.ok && Array.isArray(j.history)) setItems(j.history);
      else setMsg("Load failed");
    }catch{ setMsg("Server unreachable"); }
    setLoading(false);
  };
  useEffect(()=>{ load(); },[]);

  const openEntry = async (id:string)=>{
    try{
      const r = await fetch("/api/game/history?id="+encodeURIComponent(id),{cache:"no-store"});
      const j = await r.json().catch(()=>({}));
      if(!r.ok) throw new Error(j.error||"Load failed");
      const html: string = j.entry?.html || "";
      const blob = new Blob([html],{type:"text/html"});
      const url = URL.createObjectURL(blob);
      window.open(url,"_blank");
      setTimeout(()=>URL.revokeObjectURL(url),5000);
    }catch(e:any){ setMsg(String(e?.message||"Failed")); }
  };
  const del = async (id:string)=>{
    await fetch("/api/game/history?id="+encodeURIComponent(id),{method:"DELETE"}).catch(()=>{});
    load();
  };
  const clearAll = async ()=>{
    if(!confirm("Clear all game history?")) return;
    await fetch("/api/game/history?all=1",{method:"DELETE"}).catch(()=>{});
    load();
  };

  return (
    <div className="prose">
      <h1>🕘 Game History</h1>
      <p className="muted small">
        Every finished build auto-saves here. <Link href="/game">Back to Game Studio</Link> ·{" "}
        <Link href="/docs/game">How it works</Link>
      </p>
      <div style={{display:"flex",gap:8,margin:"12px 0"}}>
        <button className="btn-ghost" onClick={load}>↻ Refresh</button>
        {items.length>0 && <button className="btn-ghost" onClick={clearAll}>Clear all</button>}
      </div>
      {loading && <p>Loading…</p>}
      {msg && <p style={{color:"#f87171"}}>{msg}</p>}
      {!loading && items.length===0 && <p className="muted">No history yet — <Link href="/game">build your first game</Link>.</p>}
      <div className="grid g2">
        {items.map(h=>(
          <article key={h.id} className="card">
            <b>{String(h.prompt||"").slice(0,90)}</b>
            <p className="muted small" style={{margin:"6px 0"}}>
              {new Date(h.createdAt).toLocaleString()} · {h.provider||h.model} · {Math.round((h.htmlSize||0)/1024)}KB
            </p>
            {h.summary && <p className="small" style={{whiteSpace:"pre-wrap"}}>{String(h.summary).slice(0,300)}</p>}
            {h.plan && <details className="small"><summary>Plan</summary><pre style={{whiteSpace:"pre-wrap"}}>{String(h.plan).slice(0,800)}</pre></details>}
            <div style={{display:"flex",gap:8,marginTop:10}}>
              <Link className="btn-ghost" href={"/game?history="+encodeURIComponent(h.id)}>Open in Studio</Link>
              <button className="btn-ghost" onClick={()=>openEntry(h.id)}>Preview</button>
              <button className="btn-ghost" onClick={()=>del(h.id)}>Delete</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
