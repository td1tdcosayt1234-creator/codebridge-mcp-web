"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
export default function Login(){
  const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [err,setErr]=useState(""); const [busy,setBusy]=useState(false); const r=useRouter();
  async function go(e:any){ e.preventDefault(); setErr(""); setBusy(true); try{ const res=await fetch("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password})}); const j=await res.json(); if(!res.ok){setErr(j.error||"Login failed");return;} const q=new URLSearchParams(window.location.search); const nx=q.get("next")||""; r.push(nx.startsWith("/")&&!nx.startsWith("//")?nx:(j.role==="admin"?"/admin":"/dashboard")); }finally{ setBusy(false); } }
  return (<div style={{maxWidth:460,margin:"36px auto"}} className="fade-up">
    <div className="card" style={{padding:30,boxShadow:"0 30px 80px -30px #6c8cff88,0 0 60px -20px #22d3ee55",borderColor:"#22d3ee33"}}>
      <div className="kicker"><span className="pulse-dot" />Welcome back</div>
      <h1 style={{margin:"0 0 6px",letterSpacing:"-.5px"}}>Login to <span className="grad-anim">CodeBridge</span></h1>
      <p className="muted small" style={{marginTop:0}}>Local admin is set via <code>ADMIN_EMAIL</code> / <code>ADMIN_PASSWORD</code> in <code>.env</code>. Accounts lock for 15 min after 5 wrong tries.</p>
      <form onSubmit={go}><label>Email</label><input value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com"/><label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" placeholder="••••••••"/>
      {err&&<p className="small" style={{marginTop:10}}><span className="badge bad">{err}</span></p>}
      <div style={{marginTop:16}}><button className="btn btn-lg" style={{width:"100%"}} type="submit" disabled={busy}>{busy?"Logging in…":"Login"}</button></div></form>
      <p className="muted small" style={{margin:"16px 0 0",textAlign:"center"}}>No account yet? <Link href="/signup" style={{color:"var(--brand2)"}}>Sign up free →</Link></p>
    </div>
  </div>);
}
