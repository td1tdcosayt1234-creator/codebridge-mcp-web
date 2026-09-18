"use client"; import { useState } from "react";
export default function Support(){
  const [s,setS]=useState(""); const [b,setB]=useState(""); const [msg,setMsg]=useState("");
  async function send(e:any){ e.preventDefault(); const r=await fetch("/api/support",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({subject:s,body:b})}); setMsg(r.ok?"Ticket created. Admin will reply in /admin/support.":"Failed"); setS(""); setB(""); }
  return (<div style={{maxWidth:560,margin:"30px auto"}}><h1>Support</h1><p className="muted small">Ticket system. Login optional.</p><form onSubmit={send}><label>Subject</label><input value={s} onChange={e=>setS(e.target.value)}/><label>Message</label><textarea rows={5} value={b} onChange={e=>setB(e.target.value)}/><div style={{marginTop:12}}><button className="btn">Send ticket</button></div></form>{msg&&<p>{msg}</p>}</div>);
}
