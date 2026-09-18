"use client"; import { useEffect, useState } from "react";
type F = { path:string; content:string };
export default function Tasks(){
  const [tasks,setTasks]=useState<any[]>([]); const [title,setTitle]=useState(""); const [prompt,setPrompt]=useState("");
  const [kind,setKind]=useState<"compile"|"fix-compile">("compile");
  const [files,setFiles]=useState<F[]>([{path:"",content:""}]);
  const [msg,setMsg]=useState(""); const [open,setOpen]=useState<string|null>(null); const [bal,setBal]=useState<number|null>(null);
  async function load(){ const r=await fetch("/api/overview"); const j=await r.json(); if(r.ok){ setBal(j.usage?.balance??null); } const t=await fetch("/api/tasks"); const tj=await t.json(); if(t.ok) setTasks(tj.tasks||[]); }
  useEffect(()=>{ load(); const t=setInterval(load,5000); return ()=>clearInterval(t); },[]);
  const est = Math.max(1,Math.ceil(prompt.length/4)) + Math.max(1,Math.ceil(files.map(f=>f.path+"\n"+f.content).join("\n").length/4));
  const bytes = files.reduce((n,f)=>n+f.path.length+f.content.length,0);
  async function send(e:any){
    e.preventDefault(); setMsg("Request pathacchi — Actions e opencode start hobe...");
    const r=await fetch("/api/tasks",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title,prompt,kind,files:files.filter(f=>f.path.trim())})});
    const j=await r.json();
    if(!r.ok){ setMsg("Error: "+(j.error||"fail")); return; }
    setMsg("Task geche ✅ id="+j.task.id+" (~"+j.task.tokensEst+" tokens hold) — opencode kaj kore output ekhanei dibe.");
    setTitle(""); setPrompt(""); setFiles([{path:"",content:""}]); load();
  }
  return (<div>
    <h2>Compile Request — file joto boro toto token</h2>
    <p className="muted small">Sudhu compile hoy (sob type). Balance: <b>{bal===null?"...":bal}</b> tokens • ei request e ~<b>{est}</b> katbe. Fail hole <b>fix-with-compile</b> nao — opencode AI diye fix korbe (fix eo size onujayi token).</p>
    <div className="card"><form onSubmit={send}>
      <label>Title</label><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Jemon: app.py compile"/>
      <label>Mode</label><select value={kind} onChange={e=>setKind(e.target.value as any)}>
        <option value="compile">Compile only</option>
        <option value="fix-compile">Fix with compile (fail → AI auto fix, max 3 retry)</option>
      </select>
      <label>Prompt — opencode ke exactly ki compile/fix korte hobe</label><textarea rows={4} value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Jemon: attached app.py python diye compile koro, error thakle janio..."/>
      <label>Files (optional, max 200KB total — ekhon {Math.round(bytes/1024)}KB)</label>
      {files.map((f,i)=>(<div key={i} style={{border:"1px solid #ffffff14",borderRadius:12,padding:10,marginBottom:8}}>
        <input value={f.path} onChange={e=>{const c=[...files];c[i].path=e.target.value;setFiles(c);}} placeholder="path jemon: app.py / src/index.js"/>
        <textarea rows={4} value={f.content} onChange={e=>{const c=[...files];c[i].content=e.target.value;setFiles(c);}} placeholder="file content paste koro..." style={{marginTop:6}}/>
        <button type="button" className="btn-ghost" style={{marginTop:6}} onClick={()=>setFiles(files.filter((_,j)=>j!==i))}>Remove</button>
      </div>))}
      <button type="button" className="btn-ghost" onClick={()=>setFiles([...files,{path:"",content:""}])}>+ Add file</button>
      <div style={{marginTop:10}}><button className="btn">Send request (~{est} tokens)</button></div>
    </form>{msg&&<p className="small">{msg}</p>}</div>
    <h3 style={{marginTop:18}}>Amar requests (auto refresh)</h3>
    {tasks.length===0&&<p className="muted small">Ekhono request nai.</p>}
    {tasks.map((t:any)=>(<div key={t.id} className="card" style={{marginTop:8}}>
      <div><span className="badge">{t.status}</span> <span className="badge">{t.kind||"compile"}</span> <b>{t.title}</b> <span className="muted small">{t.id} • charged {t.tokensCharged||0}</span></div>
      <div style={{marginTop:8}}><button className="btn-ghost" onClick={()=>setOpen(open===t.id?null:t.id)}>{open===t.id?"Hide output":"Show output"}</button></div>
      {open===t.id&&(<div style={{marginTop:8}}><div className="muted small">Prompt:</div><pre>{t.prompt}</pre><div className="muted small">Log:</div><pre>{t.log||"—"}</pre><div className="muted small">Result:</div><pre>{t.result||"— ekhono asenai, opencode kaj korche"}</pre></div>)}
    </div>))}
  </div>);
}
