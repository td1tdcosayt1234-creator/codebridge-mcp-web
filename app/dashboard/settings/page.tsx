"use client"; import { useEffect, useState } from "react";
export default function Settings(){
  const [me,setMe]=useState<any>(null);
  const [tfa,setTfa]=useState<any>(null);
  const [secret,setSecret]=useState(""); const [otpauth,setOtpauth]=useState("");
  const [code,setCode]=useState(""); const [backup,setBackup]=useState<string[]>([]);
  const [msg,setMsg]=useState(""); const [busy,setBusy]=useState(false);
  const load=()=>{fetch("/api/auth/me").then(r=>r.json()).then(setMe);fetch("/api/auth/2fa/status").then(r=>r.json()).then(setTfa);};
  useEffect(load,[]);
  async function setup(){setBusy(true);setMsg("");try{const r=await fetch("/api/auth/2fa/setup",{method:"POST"});const j=await r.json();if(!r.ok){setMsg(j.error||"Failed");return;}setSecret(j.secret);setOtpauth(j.otpauth);}finally{setBusy(false);}}
  async function enable(){setBusy(true);setMsg("");try{const r=await fetch("/api/auth/2fa/enable",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code})});const j=await r.json();if(!r.ok){setMsg(j.error||"Failed");return;}setBackup(j.backup||[]);setSecret("");setCode("");setMsg("2FA ON — backup codes shown once, save them now.");load();}finally{setBusy(false);}}
  async function disable(){setBusy(true);setMsg("");try{const r=await fetch("/api/auth/2fa/disable",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code})});const j=await r.json();if(!r.ok){setMsg(j.error||"Failed");return;}setCode("");setMsg("2FA off.");load();}finally{setBusy(false);}}
  return (<div><h2>Settings</h2>
  <div className="card"><div>Email: <b>{me?.user?.email||"..."}</b></div><div>Plan: <span className="badge ok">{me?.user?.plan||"free"}</span> Role: <span className="badge">{me?.user?.role||"user"}</span></div><p className="muted small">Change plan in /pricing. Request data deletion with a /support ticket.</p></div>
  <div className="card" style={{marginTop:16}}><h3 style={{marginTop:0}}>🔐 Two-tier login (2FA)</h3>
  <p className="muted small">Tier-1: password. Tier-2: authenticator code for login + money/power actions{me?.user?.role==="admin"?" — admins MUST keep 2FA on.":" ."}</p>
  <p className="small">Status: {tfa?.enrolled?<span className="badge ok">ON{ tfa?.since?" since "+String(tfa.since).slice(0,10):""} · {tfa?.backupLeft??0} backup left</span>:<span className="badge warn">OFF</span>}</p>
  {!tfa?.enrolled&&!secret&&(<button className="btn" disabled={busy} onClick={setup}>Start setup</button>)}
  {!tfa?.enrolled&&secret&&(<div><p className="small">1) Scan in your authenticator app or open: <a className="link" href={otpauth} style={{color:"var(--mint-2)"}}>otpauth link</a></p><pre>{secret}</pre><p className="small">2) Enter the 6-digit code:</p><div style={{display:"flex",gap:8}}><input value={code} onChange={e=>setCode(e.target.value)} placeholder="123456" inputMode="numeric" maxLength={8} style={{maxWidth:180}}/><button className="btn" disabled={busy} onClick={enable}>Enable</button></div></div>)}
  {backup.length>0&&(<div><p className="small" style={{marginTop:12}}><b>Backup codes (once):</b></p><pre>{backup.join("  ")}</pre></div>)}
  {tfa?.enrolled&&(<div style={{display:"flex",gap:8,marginTop:8}}><input value={code} onChange={e=>setCode(e.target.value)} placeholder="code to disable" inputMode="numeric" maxLength={8} style={{maxWidth:180}}/><button className="btn-ghost" disabled={busy} onClick={disable}>Disable 2FA</button></div>)}
  {msg&&(<p className="small" style={{marginTop:10}}><span className="badge">{msg}</span></p>)}
  </div></div>);
}
