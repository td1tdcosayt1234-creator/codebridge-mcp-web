"use client"; import { useState } from "react";
import Link from "next/link";
export default function Support(){
  const [s,setS]=useState(""); const [b,setB]=useState(""); const [hp,setHp]=useState(""); const [msg,setMsg]=useState("");
  async function send(e:any){
    e.preventDefault();
    if(!s.trim()||!b.trim()){ setMsg("Please write both subject and message."); return; }
    const r=await fetch("/api/support",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({subject:s,body:b,website:hp})});
    const j=await r.json().catch(()=>({}));
    setMsg(r.ok?"Ticket sent. The admin will reply from /admin/support.":("Failed: "+(j.error||"try again")));
    if(r.ok){ setS(""); setB(""); }
  }
  return (<div className="prose"><div className="page-hero" style={{textAlign:"center"}}><h1>Support — <span className="grad">get help</span></h1><p style={{margin:"0 auto"}}>Open a ticket and the admin will reply. Check the quick fixes below first — most issues solve in a minute.</p></div>
  <div className="grid g3">
    <div className="card"><h3>🔌 MCP will not connect?</h3><p className="muted small">Is the web server on? URL correct? Did you restart OpenCode? Key in headers? Full steps: <Link href="/mcp">/mcp</Link></p></div>
    <div className="card"><h3>🔑 Access error?</h3><p className="muted small">“Low balance” = earn coins in /dashboard/earn. “VPN not allowed” = disable VPN. “Bot detected” = fill forms manually. Details: <Link href="/docs">/docs</Link></p></div>
    <div className="card"><h3>❓ Other questions?</h3><p className="muted small">Read the <Link href="/faq">FAQ</Link> first — 17 answers ready.</p></div>
  </div>
  <div className="card" style={{maxWidth:600,margin:"18px auto 0"}}><h3>🎫 Open a ticket</h3><p className="muted small">Login is optional, but logged-in tickets get matched to you and answered faster. Max 5 tickets/hour.</p><form onSubmit={send}><label>Subject (e.g. build failed, MCP 404)</label><input value={s} onChange={e=>setS(e.target.value)} placeholder="Short title"/><label>Message (what you did, the error, run_id if any)</label><textarea rows={5} value={b} onChange={e=>setB(e.target.value)} placeholder="Write details..."/><input name="website" value={hp} onChange={e=>setHp(e.target.value)} autoComplete="off" tabIndex={-1} aria-hidden="true" style={{position:"absolute",left:"-9999px",opacity:0,height:0}}/><div style={{marginTop:12}}><button className="btn">Send ticket</button></div></form>{msg&&<p className="small">{msg}</p>}</div></div>);
}
