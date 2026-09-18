"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export default function Login(){
  const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [err,setErr]=useState(""); const r=useRouter();
  async function go(e:any){ e.preventDefault(); setErr(""); const res=await fetch("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password})}); const j=await res.json(); if(!res.ok){setErr(j.error||"Login failed");return;} r.push(j.role==="admin"?"/admin":"/dashboard"); }
  return (<div style={{maxWidth:420,margin:"30px auto"}}><h1>Login</h1><p className="muted small">Demo admin: admin@local.test / admin123 (change in production). Accounts lock for 15 min after 5 wrong tries.</p><form onSubmit={go}><label>Email</label><input value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email"/><label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password"/>{err&&<p style={{color:"#fca5a5"}}>{err}</p>}<div style={{marginTop:14}}><button className="btn" type="submit">Login</button></div></form></div>);
}
