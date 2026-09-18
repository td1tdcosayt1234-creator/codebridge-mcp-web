"use client"; import { useState } from "react";
import Link from "next/link";
export default function Support(){
  const [s,setS]=useState(""); const [b,setB]=useState(""); const [msg,setMsg]=useState("");
  async function send(e:any){ e.preventDefault(); if(!s.trim()||!b.trim()){setMsg("Subject + message dui tai likho.");return;} const r=await fetch("/api/support",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({subject:s,body:b})}); setMsg(r.ok?"Ticket geche ✅ Admin /admin/support theke dekhbe.":"Failed — abar try koro."); setS(""); setB(""); }
  return (<div className="prose"><div className="page-hero" style={{textAlign:"center"}}><h1>Support — <span className="grad">help paba</span></h1><p style={{margin:"0 auto"}}>Ticket kholo, admin reply dibe. Age niche common fix gulo dekho — 1 minute e solve hote pare.</p></div>
  <div className="grid g3">
    <div className="card"><h3>🔌 MCP connect hoy na?</h3><p className="muted small">Web server on? URL thik? OpenCode restart diso? Key lagle headers e bosaiso? Full steps: <Link href="/mcp">/mcp</Link></p></div>
    <div className="card"><h3>🔑 Token error?</h3><p className="muted small">“GitHub token set nai” = admin global token dey nai. “Auth lagbe” = MCP key missing. Details: <Link href="/docs">/docs</Link></p></div>
    <div className="card"><h3>❓ Onno prosno?</h3><p className="muted small">Age <Link href="/faq">FAQ</Link> dekho — 11 ta answer ready.</p></div>
  </div>
  <div className="card" style={{maxWidth:600,margin:"18px auto 0"}}><h3>🎫 Ticket kholo</h3><p className="muted small">Login optional, tobe login thakle tomar sathe match kore fast reply hoy.</p><form onSubmit={send}><label>Subject (jemon: build fail, MCP 404)</label><input value={s} onChange={e=>setS(e.target.value)} placeholder="Short title"/><label>Message (ki korsila, ki error asche, run_id thakle dao)</label><textarea rows={5} value={b} onChange={e=>setB(e.target.value)} placeholder="Details likho..."/><div style={{marginTop:12}}><button className="btn">Send ticket</button></div></form>{msg&&<p className="small">{msg}</p>}</div></div>);
}
