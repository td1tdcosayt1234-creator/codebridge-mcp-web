"use client"; import { useEffect, useState } from "react";
import { useAdblock } from "../../../components/ads/useAdblock";
type F = { path:string; content:string; src?:string; size?:number };
export default function Tasks(){
  const [tasks,setTasks]=useState<any[]>([]); const [title,setTitle]=useState(""); const [prompt,setPrompt]=useState("");
  const [kind,setKind]=useState<"compile"|"fix-compile">("compile");
  const [files,setFiles]=useState<F[]>([{path:"",content:""}]);
  const [msg,setMsg]=useState(""); const [open,setOpen]=useState<string|null>(null); const [bal,setBal]=useState<number|null>(null); const [hp,setHp]=useState(""); const [busy,setBusy]=useState(false); const [peek,setPeek]=useState<string|null>(null);
  const { adblock, recheck } = useAdblock();
  async function load(){ try {
    const r=await fetch("/api/overview"); const j=await r.json().catch(()=>({})); if(r.ok){ setBal(j.usage?.balance??null); }
    const t=await fetch("/api/tasks"); const tj=await t.json().catch(()=>({})); if(t.ok) setTasks(tj.tasks||[]);
  } catch { /* polling continues on next tick */ } }
  useEffect(()=>{ load(); const t=setInterval(load,5000); return ()=>clearInterval(t); },[]);
  const est = Math.max(1,Math.ceil(prompt.length/4)) + Math.max(1,Math.ceil(files.map(f=>f.path+"\n"+f.content).join("\n").length/4));
  const bytes = files.reduce((n,f)=>n+f.path.length+f.content.length,0);
  // Upload: merge picked files into the file list — path dedupe (replace), binary skip,
  // per-file 100k char cap and 200KB total (same limits the server enforces).
  async function addUploaded(picked: FileList | File[] | null){
    const list = Array.from(picked||[]);
    if(!list.length) return;
    const warn: string[] = []; const add: F[] = [];
    for(const f of list){
      const path = ((f as any).webkitRelativePath || f.name).replace(/\\/g,"/").replace(/^\/+/,"");
      let text = "";
      try { text = await f.text(); } catch { warn.push(path+" (read fail)"); continue; }
      if(/\u0000/.test(text.slice(0,8000))){ warn.push(path+" (binary skipped — text files only)"); continue; }
      if(text.length > 100000){ warn.push(path+" skipped (>100KB/file)"); continue; }
      add.push({ path: path.slice(0,200), content: text.replace(/\0/g,""), src:"upload", size:text.length });
    }
    let merged = files.filter(f=>!add.some(a=>a.path===f.path) && f.path.trim()).concat(add);
    if(merged.length > 50){ warn.push("50+ files — only the first 50 kept"); merged = merged.slice(0,50); }
    const cap = 200*1024; const kept: F[] = []; let total = 0;
    for(const f of merged){ const b = f.path.length+f.content.length; if(total+b > cap){ warn.push(f.path+" skipped (200KB total)"); continue; } total += b; kept.push(f); }
    kept.push({path:"",content:""}); // empty row for the next manual paste
    setFiles(kept);
    setMsg(add.length? ("Uploaded "+add.length+" file(s)."+(warn.length?" Skipped: "+warn.join(", "):"")) : "Upload failed: "+warn.join(", "));
  }
  async function send(e:any){
    e.preventDefault();
    if(busy) return;
    const blockedNow = recheck();
    if(blockedNow){ setMsg("Error: Adblock detected — turn it off to send requests."); return; }
    setBusy(true); setMsg("Sending request — AI will start in the cloud...");
    try{
      const r=await fetch("/api/tasks",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title,prompt,kind,website:hp,adblock:blockedNow,files:files.filter(f=>f.path.trim())})});
      const t=await r.text(); let j:any={}; try{ j=JSON.parse(t); }catch{ /* non-JSON error page */ }
      if(!r.ok){ setMsg("Error: "+(j.error||("Request failed (HTTP "+r.status+")"))); return; }
      if(!j.task){ setMsg("Error: unexpected server response."); return; }
      setMsg("Request sent. id="+j.task.id+" (~"+j.task.tokensEst+" coins held) — Roun Co Pilot will deliver the output here.");
      setTitle(""); setPrompt(""); setFiles([{path:"",content:""}]); load();
    }catch{
      setMsg("Error: network failed — check your internet/tunnel and try again.");
    }finally{ setBusy(false); }
  }
  return (<div>
    <h2>Compile request — bigger files cost more coins</h2>
    <p className="muted small">Compile only (all types). Balance: <b>{bal===null?"...":bal}</b> coins • this request costs ~<b>{est}</b>. On failure, <b>fix-with-compile</b> lets Roun Co Pilot fix it with AI (fix size is charged too).</p>
    <div className="card"><form onSubmit={send}>
      <label>Title</label><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="E.g. compile app.py"/>
      <label>Mode</label><select value={kind} onChange={e=>setKind(e.target.value as any)}>
        <option value="compile">Compile only</option>
        <option value="fix-compile">Fix with compile (on fail → AI auto-fix, max 3 retries)</option>
      </select>
      <label>Prompt — exactly what Roun Co Pilot must compile/fix</label><textarea rows={4} value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="E.g. compile the attached app.py with python and report errors..."/>
      <label>Files (optional, max 200KB total — now {bytes<1024?bytes+"B":Math.round(bytes/1024)+"KB"}) — paste here or upload files/folders; uploaded content stays hidden</label>
      {files.map((f,i)=>(
        f.src==="upload"
        ? (<div key={"u"+i} style={{border:"1px solid #ffffff14",borderRadius:12,padding:8,marginBottom:8,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <span className="badge ok">⬆ {f.size&&f.size<1024?f.size+"B":Math.round((f.size||0)/1024)+"KB"}</span>
            <b className="small" style={{wordBreak:"break-all"}}>{f.path}</b>
            <button type="button" className="btn-ghost" style={{marginLeft:"auto"}} onClick={()=>setPeek(peek===f.path?null:f.path)}>{peek===f.path?"Hide content":"View content"}</button>
            <button type="button" className="btn-ghost" onClick={()=>{ setFiles(files.filter((_,j)=>j!==i)); if(peek===f.path) setPeek(null); }}>Remove</button>
            {peek===f.path&&<textarea rows={4} readOnly value={f.content} style={{width:"100%",marginTop:6}}/>}
          </div>)
        : (<div key={i} style={{border:"1px solid #ffffff14",borderRadius:12,padding:10,marginBottom:8}}>
            <input value={f.path} onChange={e=>{const c=[...files];c[i].path=e.target.value;setFiles(c);}} placeholder="Path, e.g. app.py / src/index.js"/>
            <textarea rows={4} value={f.content} onChange={e=>{const c=[...files];c[i].content=e.target.value;setFiles(c);}} placeholder="Paste file content..." style={{marginTop:6}}/>
            <button type="button" className="btn-ghost" style={{marginTop:6}} onClick={()=>setFiles(files.filter((_,j)=>j!==i))}>Remove</button>
          </div>)
      ))}
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <button type="button" className="btn-ghost" onClick={()=>setFiles([...files,{path:"",content:""}])}>+ Add file</button>
        <button type="button" className="btn-ghost" onClick={()=>(document.getElementById("task-upload") as HTMLInputElement)?.click()}>⬆ Upload files</button>
        <button type="button" className="btn-ghost" onClick={()=>(document.getElementById("task-uploaddir") as HTMLInputElement)?.click()}>⬆ Upload folder</button>
      </div>
      <input id="task-upload" multiple type="file" style={{position:"absolute",width:1,height:1,opacity:0,overflow:"hidden"}} onChange={async e=>{ const el=e.currentTarget; await addUploaded(el.files); el.value=""; }}/>
      <input id="task-uploaddir" type="file" multiple {...({ webkitdirectory:"true", directory:"" } as any)} style={{position:"absolute",width:1,height:1,opacity:0,overflow:"hidden"}} onChange={async e=>{ const el=e.currentTarget; await addUploaded(el.files); el.value=""; }}/>
      <input name="website" value={hp} onChange={e=>setHp(e.target.value)} autoComplete="off" tabIndex={-1} aria-hidden="true" style={{position:"absolute",left:"-9999px",opacity:0,height:0}}/>
      <div style={{marginTop:10}}><button className="btn" disabled={busy}>{busy?"Sending...":("Send request (~"+est+" coins)")}</button></div>
    </form>{msg&&<p className="small">{msg}</p>}</div>
    <h3 style={{marginTop:18}}>My requests (auto refresh)</h3>
    {tasks.length===0&&<p className="muted small">No requests yet.</p>}
    {tasks.map((t:any)=>(<div key={t.id} className="card" style={{marginTop:8}}>
      <div><span className="badge">{t.status}</span> <span className="badge">{t.kind||"compile"}</span> <b>{t.title}</b> <span className="muted small">{t.id} • charged {t.tokensCharged||0}</span>{t.apkSize>0&&<span> • <a href={"/api/tasks/"+t.id+"/apk"}>Download APK ({Math.round(t.apkSize/1048576*10)/10} MB)</a></span>}{t.jarSize>0&&<span> • <a href={"/api/tasks/"+t.id+"/jar"}>Download JAR ({t.jarName||"plugin.jar"}, {Math.round(t.jarSize/1048576*10)/10} MB)</a></span>}{t.exeSize>0&&<span> • <a href={"/api/tasks/"+t.id+"/exe"}>Download EXE ({t.exeName||"app.exe"}, {Math.round(t.exeSize/1048576*10)/10} MB)</a></span>}{t.debSize>0&&<span> • <a href={"/api/tasks/"+t.id+"/deb"}>Download DEB ({t.debName||"app.deb"}, {Math.round(t.debSize/1048576*10)/10} MB)</a></span>}</div>
      <div style={{marginTop:8}}><button className="btn-ghost" onClick={()=>setOpen(open===t.id?null:t.id)}>{open===t.id?"Hide output":"Show output"}</button></div>
      {open===t.id&&(<div style={{marginTop:8}}><div className="muted small">Prompt:</div><pre>{t.prompt}</pre><div className="muted small">Log:</div><pre>{t.log||"—"}</pre><div className="muted small">Result:</div><pre>{t.result||"— not yet, Roun Co Pilot is working"}</pre></div>)}
    </div>))}
  </div>);
}
