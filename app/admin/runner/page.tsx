"use client"; import { useEffect, useState } from "react";
const YAML = `name: opencode-task
on:
  workflow_dispatch:
    inputs:
      task_id:
        description: 'CodeBridge task id'
        required: true
jobs:
  agent:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install opencode
        run: |
          curl -fsSL https://opencode.ai/install | bash
          echo "$HOME/.opencode/bin" >> $GITHUB_PATH
      - name: Pull task from web
        run: |
          curl -sf -H "Authorization: Bearer \${{ secrets.RUNNER_TOKEN }}" \\
            "$WEB_URL/api/runner/next?task_id=\${{ inputs.task_id }}" -o task.json
          cat task.json
        env:
          WEB_URL: \${{ secrets.WEB_URL }}
      - name: Write task files
        run: |
          node -e "
          const fs=require('fs');
          const t=JSON.parse(fs.readFileSync('task.json','utf8'));
          for(const f of (t.files||[])){fs.mkdirSync(require('path').dirname(f.path),{recursive:true});fs.writeFileSync(f.path,f.content);}
          console.log('files:',(t.files||[]).length,'kind:',t.kind);
          "
      - name: Run opencode
        run: |
          node -e "const t=require('./task.json').prompt" 2>/dev/null; node -e "const t=require('./task.json');require('fs').writeFileSync('prompt.txt',t.prompt)"
          opencode run --auto -m anthropic/claude-sonnet-4-6 "$(cat prompt.txt)" 2>&1 | tee agent.log
        env:
          ANTHROPIC_API_KEY: \${{ secrets.ANTHROPIC_API_KEY }}
      - name: Send result to web
        if: always()
        run: |
          node -e "
          const fs=require('fs');
          const ok=fs.existsSync('agent.log');
          const log=ok?fs.readFileSync('agent.log','utf8').slice(-15000):'no log';
          fetch(process.env.WEB_URL+'/api/runner/update',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+process.env.RUNNER_TOKEN},body:JSON.stringify({id:'\${{ inputs.task_id }}',status:ok?'done':'failed',log,result:log})}).then(r=>console.log('sent',r.status));
          "
        env:
          WEB_URL: \${{ secrets.WEB_URL }}
          RUNNER_TOKEN: \${{ secrets.RUNNER_TOKEN }}
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: task-\${{ inputs.task_id }}
          path: agent.log
`;
export default function AdminRunner(){
  const [st,setSt]=useState<any>(null); const [repo,setRepo]=useState(""); const [wf,setWf]=useState("opencode-task.yml"); const [msg,setMsg]=useState(""); const [newToken,setNewToken]=useState("");
  async function load(){ const r=await fetch("/api/admin/runner"); const j=await r.json(); setSt(j); if(j.builderRepo!==undefined){ setRepo(j.builderRepo||""); setWf(j.builderWorkflow||"opencode-task.yml"); } }
  useEffect(()=>{load();},[]);
  async function save(e:any){ e.preventDefault(); const r=await fetch("/api/admin/runner",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({builderRepo:repo,builderWorkflow:wf})}); setMsg(r.ok?"Saved ✅":"Failed"); load(); }
  async function regen(){ if(!confirm("Notun runner token? Purono token diye runner fail korbe.")) return; const r=await fetch("/api/admin/runner",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({regenerate:true})}); const j=await r.json(); if(r.ok){ setNewToken(j.token); setMsg("Token ekbar e dekhabe — ekhoni copy kore repo secret e bosao."); } load(); }
  if(!st) return <p className="muted">Loading...</p>;
  if(st.error) return <p>Admin only. <a href="/login">Login</a></p>;
  return (<div>
    <h2>Runner — Actions e opencode</h2>
    <p className="muted small">User web e request dibe → web builder repo te workflow_dispatch dibe → Actions e opencode run → output web e fire asbe → user dekhbe. User repo chhobe na.</p>
    <div className="grid g2">
      <div className="card"><h3>1️⃣ Builder repo</h3><form onSubmit={save}>
        <label>Builder repo (owner/repo) — workflow file ekhane thakte hobe</label><input value={repo} onChange={e=>setRepo(e.target.value)} placeholder="owner/repo"/>
        <label>Workflow file</label><input value={wf} onChange={e=>setWf(e.target.value)}/>
        <div style={{marginTop:10}}><button className="btn">Save</button></div></form>{msg&&<p className="small">{msg}</p>}
        <p className="muted small">Status: queued {st.counts?.queued||0} • running {st.counts?.running||0} • done {st.counts?.done||0} • failed {st.counts?.failed||0}</p></div>
      <div className="card"><h3>2️⃣ Runner token {st.tokenConfigured?<span className="badge ok">set</span>:<span className="badge bad">not set</span>}</h3>
        <p className="muted small">Builder repo secrets e <code>RUNNER_TOKEN</code> hisabe bosao.</p>
        <button className="btn-ghost" onClick={regen}>Regenerate token</button>
        {newToken&&<pre style={{marginTop:8}}>{newToken}</pre>}</div>
    </div>
    <div className="card" style={{marginTop:12}}><h3>3️⃣ Workflow file — builder repo te <code>.github/workflows/{wf||"opencode-task.yml"}</code> baniye bosao</h3>
      <p className="muted small">Repo secrets must: <code>WEB_URL</code> (public URL, jemon https://tomar-domain.com — localhost e GitHub runner pouchate parbe na, tokhon self-hosted runner lagbe), <code>RUNNER_TOKEN</code> (uporer), <code>ANTHROPIC_API_KEY</code> (opencode er model key). Model line nijer moto bodlao.</p>
      <pre>{YAML}</pre></div>
    <div className="card" style={{marginTop:12}}><h3>Recent tasks</h3>
      {(st.recent||[]).length===0&&<p className="muted small">Kono task nai.</p>}
      {(st.recent||[]).map((t:any)=>(<div key={t.id} className="small" style={{borderBottom:"1px solid #ffffff12",padding:"6px 0"}}><span className="badge">{t.status}</span> <b>{t.title}</b> <span className="muted">{t.id} • user {t.userId}</span></div>))}
    </div>
  </div>);
}
