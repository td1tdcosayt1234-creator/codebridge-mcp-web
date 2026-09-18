"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export default function Signup(){
  const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [hp,setHp]=useState(""); const [err,setErr]=useState(""); const r=useRouter();
  async function go(e:any){ e.preventDefault(); setErr(""); const res=await fetch("/api/auth/signup",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password,website:hp})}); const j=await res.json(); if(!res.ok){setErr(j.error||"Signup failed");return;} r.push("/dashboard"); }
  return (<div style={{maxWidth:420,margin:"30px auto"}}><h1>Sign up — free</h1><p className="muted small">10,000 coins included. Password: min 8 chars, letters + numbers.</p><form onSubmit={go}><label>Email</label><input value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email"/><label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password"/><input name="website" value={hp} onChange={e=>setHp(e.target.value)} autoComplete="off" tabIndex={-1} aria-hidden="true" style={{position:"absolute",left:"-9999px",opacity:0,height:0}}/>{err&&<p style={{color:"#fca5a5"}}>{err}</p>}<div style={{marginTop:14}}><button className="btn" type="submit">Create account</button></div></form></div>);
}
