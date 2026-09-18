"use client"; import { useEffect, useState } from "react";
export default function AdminGithub(){
  const [token,setToken]=useState(""); const [st,setSt]=useState<any>(null); const [msg,setMsg]=useState("");
  async function load(){ const r=await fetch("/api/admin/github"); setSt(await r.json()); }
  useEffect(()=>{load();},[]);
  async function save(e:any){
    e.preventDefault(); setMsg("Verifying + saving...");
    const r=await fetch("/api/admin/github",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token})});
    const j=await r.json(); setMsg(r.ok?"Global token saved. The tool now runs on it.":"Error: "+(j.error||"failed"));
    setToken(""); load();
  }
  async function del(){ if(!confirm("Remove the global token? The tool will then only run where a token exists.")) return; await fetch("/api/admin/github",{method:"DELETE"}); load(); }
  if(st?.error) return <p>Admin only. <a href="/login">Login as admin</a></p>;
  return (<div>
    <h2>Global GitHub Classic Token</h2>
    <p className="muted small">Set one Classic Token here (ghp_..., scopes: repo + workflow). If a user has no own token, the tool automatically uses this global token for repo list / push / build. A user token, if present, takes priority.</p>
    <div className="card">
      <div>Status: <b>{st?.configured?"configured":"not set"}</b>{st?.configured&&<span className="muted small"> — by {st.updatedBy} at {st.updatedAt}</span>}</div>
      <form onSubmit={save}>
        <label>Paste new global Classic Token (verified before saving)</label>
        <input value={token} onChange={e=>setToken(e.target.value)} placeholder="ghp_..." autoComplete="off"/>
        <div style={{marginTop:10,display:"flex",gap:8}}>
          <button className="btn">Save global token</button>
          <button type="button" className="btn-ghost" onClick={del}>Remove</button>
        </div>
      </form>
      {msg&&<p className="small">{msg}</p>}
    </div>
  </div>);
}
