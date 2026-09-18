"use client"; import { useEffect, useState } from "react";
type F = { path:string; content:string };
export default function Tasks(){
  const [tasks,setTasks]=useState<any[]>([]); const [title,setTitle]=useState(""); const [prompt,setPrompt]=useState("");
  const [kind,setKind]=useState<"compile"|"fix-compile">("compile");
  const [files,setFiles]=useState<F[]>([{path:"",content:""}]);
  const [msg,setMsg]=useState(""); const [open,setOpen]=useState<string|null>(null); const [bal,setBal]=useState<number|null>(null); const [hp,setHp]=useState("");
  async function load(){ const r=await fetch("/api/overview"); const j=await r.json(); if(r.ok){ setBal(j.usage?.balance??null); } const t=await fetch("/api/tasks"); const tj=await t.json(); if(t.ok) setTasks(tj.tasks||[]); }
  useEffect(()=>{ load(); const t=setInterval(load,5000); return ()=>clearInterval(t); },[]);
  const est = Math.max(1,Math.ceil(prompt.length/4)) + Math.max(1,Math.ceil(files.map(f=>f.path+"\n"+f.content).join("\n").length/4));
  const bytes = files.reduce((n,f)=>n+f.path.length+f.content.length,0);
  async function send(e:any){
    e.preventDefault(); setMsg("Sending request — AI will start in the cloud...");
    const r=await fetch("/api/tasks",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title,prompt,kind,website:hp,files:files.filter(f=>f.path.trim())})});
    const j=await r.json();
    if(!r.ok){ setMsg("Error: "+(j.error||"failed")); return; }
    setMsg("Request sent. id="+j.task.id+" (~"+j.task.tokensEst+" coins held) — OpenCode will deliver the output here.");
    setTitle(""); setPrompt(""); setFiles([{path:"",content:""}]); load();
  }
  return (<div>
    <h2>Compile request — bigger files cost more coins</h2>
    <p className="muted small">Compile only (all types). Balance: <b>{bal===null?"...":bal}</b> coins • this request costs ~<b>{est}</b>. On failure, <b>fix-with-compile</b> lets OpenCode fix it with AI (fix size is charged too).</p>
    <div className="card"><form onSubmit={send}>
      <label>Title</label><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="E.g. compile app.py"/>
      <label>Mode</label><select value={kind} onChange={e=>setKind(e.target.value as any)}>
        <option value="compile">Compile only</option>
        <option value="fix-compile">Fix with compile (on fail → AI auto-fix, max 3 retries)</option>
      </select>
      <label>Prompt — exactly what OpenCode must compile/fix</label><textarea rows={4} value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="E.g. compile the attached app.py with python and report errors..."/>
      <label>Files (optional, max 200KB total — now {Math.round(bytes/1024)}KB)</label>
      {files.map((f,i)=>(<div key={i} style={{border:"1px solid #ffffff14",borderRadius:12,padding:10,marginBottom:8}}>
        <input value={f.path} onChange={e=>{const c=[...files];c[i].path=e.target.value;setFiles(c);}} placeholder="Path, e.g. app.py / src/index.js"/>
        <textarea rows={4} value={f.content} onChange={e=>{const c=[...files];c[i].content=e.target.value;setFiles(c);}} placeholder="Paste file content..." style={{marginTop:6}}/>
        <button type="button" className="btn-ghost" style={{marginTop:6}} onClick={()=>setFiles(files.filter((_,j)=>j!==i))}>Remove</button>
      </div>))}
      <button type="button" className="btn-ghost" onClick={()=>setFiles([...files,{path:"",content:""}])}>+ Add file</button>
      <input name="website" value={hp} onChange={e=>setHp(e.target.value)} autoComplete="off" tabIndex={-1} aria-hidden="true" style={{position:"absolute",left:"-9999px",opacity:0,height:0}}/>
      <div style={{marginTop:10}}><button className="btn">Send request (~{est} coins)</button></div>
    </form>{msg&&<p className="small">{msg}</p>}</div>
    <h3 style={{marginTop:18}}>My requests (auto refresh)</h3>
    {tasks.length===0&&<p className="muted small">No requests yet.</p>}
    {tasks.map((t:any)=>(<div key={t.id} className="card" style={{marginTop:8}}>
      <div><span className="badge">{t.status}</span> <span className="badge">{t.kind||"compile"}</span> <b>{t.title}</b> <span className="muted small">{t.id} • charged {t.tokensCharged||0}</span></div>
      <div style={{marginTop:8}}><button className="btn-ghost" onClick={()=>setOpen(open===t.id?null:t.id)}>{open===t.id?"Hide output":"Show output"}</button></div>
      {open===t.id&&(<div style={{marginTop:8}}><div className="muted small">Prompt:</div><pre>{t.prompt}</pre><div className="muted small">Log:</div><pre>{t.log||"—"}</pre><div className="muted small">Result:</div><pre>{t.result||"— not yet, OpenCode is working"}</pre></div>)}
    </div>))}
  </div>);
}
