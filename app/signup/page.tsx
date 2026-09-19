"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
export default function Signup(){
  const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [hp,setHp]=useState(""); const [err,setErr]=useState(""); const [busy,setBusy]=useState(false); const r=useRouter();
  async function go(e:any){ e.preventDefault(); setErr(""); setBusy(true); try{ const res=await fetch("/api/auth/signup",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password,website:hp})}); const j=await res.json(); if(!res.ok){setErr(j.error||"Signup failed");return;} r.push("/dashboard"); }finally{ setBusy(false); } }
  return (<div style={{maxWidth:460,margin:"36px auto"}} className="fade-up">
    <div className="card" style={{padding:30,boxShadow:"0 30px 80px -30px #6c8cff88,0 0 60px -20px #22d3ee55",borderColor:"#22d3ee33"}}>
      <div className="kicker"><span className="pulse-dot" />Join free</div>
      <h1 style={{margin:"0 0 6px",letterSpacing:"-.5px"}}>Sign up — <span className="grad-anim">free</span></h1>
      <p className="muted small" style={{marginTop:0}}><b className="grad-anim">10,000 coins</b> included. Password: min 8 chars, letters + numbers.</p>
      <form onSubmit={go}><label>Email</label><input value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com"/><label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password" placeholder="••••••••"/><input name="website" value={hp} onChange={e=>setHp(e.target.value)} autoComplete="off" tabIndex={-1} aria-hidden="true" style={{position:"absolute",left:"-9999px",opacity:0,height:0}}/>
      {err&&<p className="small" style={{marginTop:10}}><span className="badge bad">{err}</span></p>}
      <div style={{marginTop:16}}><button className="btn btn-lg" style={{width:"100%"}} type="submit" disabled={busy}>{busy?"Creating…":"Create account"}</button></div></form>
      <p className="muted small" style={{margin:"16px 0 0",textAlign:"center"}}>Already have an account? <Link href="/login" style={{color:"var(--brand2)"}}>Login →</Link></p>
    </div>
  </div>);
}
