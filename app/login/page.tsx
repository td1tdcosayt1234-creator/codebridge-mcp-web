"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
export default function Login(){
  const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [show,setShow]=useState(false); const [remember,setRemember]=useState(true);
  const [err,setErr]=useState(""); const [busy,setBusy]=useState(false); const [shake,setShake]=useState(0); const r=useRouter();
  async function go(e:any){ e.preventDefault(); setErr(""); setBusy(true); try{ const res=await fetch("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password,remember})}); const j=await res.json(); if(!res.ok){setErr(j.error||"Login failed");setShake(s=>s+1);return;} const q=new URLSearchParams(window.location.search); const nx=q.get("next")||""; r.push(nx.startsWith("/")&&!nx.startsWith("//")?nx:(j.role==="admin"?"/admin":"/dashboard")); }finally{ setBusy(false); } }
  return (<div className="auth-wrap fade-up">
    <div key={shake} className={"card auth-card"+(err?" shake":"")}>
      <div className="kicker"><span className="pulse-dot" />Welcome back</div>
      <h1 style={{margin:"0 0 6px",letterSpacing:"-.5px"}}>Login to <span className="grad-anim">CodeBridge</span></h1>
      <p className="muted small" style={{marginTop:0}}>Local admin is set via <code>ADMIN_EMAIL</code> / <code>ADMIN_PASSWORD</code> in <code>.env</code>. Accounts lock for 15 min after 5 wrong tries.</p>
      <form onSubmit={go}><label>Email</label><input value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com"/><label>Password</label>
      <div className="pw-wrap"><input type={show?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" placeholder="••••••••"/><button type="button" className="pw-toggle" onClick={()=>setShow(v=>!v)}>{show?"Hide":"Show"}</button></div>
      <label style={{display:"flex",gap:8,alignItems:"center",marginTop:12,cursor:"pointer"}}><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)} style={{width:"auto"}} />Remember me — 30 days, all tabs</label>
      {err&&<p className="small" style={{marginTop:10}}><span className="badge bad">{err}</span></p>}
      <div style={{marginTop:16}}><button className="btn btn-lg" style={{width:"100%"}} type="submit" disabled={busy}>{busy?"Logging in…":"Login →"}</button></div></form>
      <p className="muted small" style={{margin:"12px 0 0",textAlign:"center"}}>Tip: login works per address — localhost, tailnet IP and tunnel URL each need their own login. Pick one and bookmark it.</p>
      <p className="muted small" style={{margin:"16px 0 0",textAlign:"center"}}>No account yet? <Link href="/signup" style={{color:"var(--brand2)"}}>Sign up free →</Link></p>
    </div>
  </div>);
}
