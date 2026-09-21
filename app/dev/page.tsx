"use client";
import { useState, useRef } from "react";

const TEMPLATES = [
  { id:"snake", name:"Snake", desc:"Classic neon snake", icon:"🐍", color:"#22d3ee" },
  { id:"flappy", name:"Flappy", desc:"Tap to fly", icon:"🐤", color:"#fde047" },
  { id:"pong", name:"Pong", desc:"Duel paddles", icon:"🏓", color:"#6c8cff" },
  { id:"breakout", name:"Breakout", desc:"Brick breaker", icon:"🧱", color:"#a855f7" },
  { id:"generic", name:"Particles", desc:"Interactive burst", icon:"✨", color:"#f59e0b" },
];

export default function DevStudio(){
  const [prompt,setPrompt]=useState("");
  const [template,setTemplate]=useState("snake");
  const [style,setStyle]=useState("neon");
  const [html,setHtml]=useState("");
  const [loading,setLoading]=useState(false);
  const [showCode,setShowCode]=useState(false);
  const [isFs,setIsFs]=useState(false);
  const frameRef=useRef<HTMLIFrameElement>(null);
  const gen = async (customPrompt?: string)=>{
    const p = (customPrompt||prompt||template).trim();
    if(!p) return;
    setLoading(true);
    try{
      const r = await fetch("/api/dev/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:p, template, style})});
      const j = await r.json();
      if(j.html){ setHtml(j.html); setShowCode(false); }
    }catch(e){ console.error(e)}
    setLoading(false);
  };
  const download = ()=>{
    if(!html) return;
    const blob=new Blob([html],{type:"text/html"});
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download="game.html";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const copyCode=async()=>{
    if(!html) return;
    await navigator.clipboard.writeText(html);
  };
  const share=async()=>{
    const url = location.origin+"/dev?prompt="+encodeURIComponent(prompt||template);
    await navigator.clipboard.writeText(url);
  };
  return (
    <div style={{maxWidth:1240,margin:"0 auto"}}>
      <style>{`
        .dev-hero{position:relative;overflow:hidden;border-radius:20px;background:linear-gradient(135deg,#0e152b 0%,#0f172a 55%,#1e1b4b 100%);border:1px solid #ffffff14;padding:22px 22px 18px;box-shadow:0 20px 60px #0006}
        .dev-hero h1{font-size:28px;letter-spacing:-.02em;margin:0}
        .dev-hero p{opacity:.7;margin:6px 0 0;font-size:13px}
        .dev-grid{display:grid;grid-template-columns:380px 1fr;gap:16px;margin-top:16px}
        @media(max-width:900px){.dev-grid{grid-template-columns:1fr}}
        .panel{background:#0e152b;border:1px solid #ffffff14;border-radius:16px;overflow:hidden}
        .panel-head{padding:12px 14px;border-bottom:1px solid #ffffff0f;display:flex;justify-content:space-between;align-items:center;font-weight:700;font-size:13px}
        .panel-body{padding:14px}
        .tpl-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
        .tpl{padding:12px;border-radius:12px;border:1px solid #ffffff14;background:#ffffff08;cursor:pointer;transition:.15s}
        .tpl:hover{transform:translateY(-1px);border-color:#ffffff28}
        .tpl.active{outline:2px solid var(--brand);background:#6c8cff18}
        .tpl b{display:block;font-size:13px}
        .tpl span{font-size:11px;opacity:.6}
        .field{width:100%;padding:10px 12px;border-radius:12px;border:1px solid #ffffff14;background:#020617;color:#eaf0ff;outline:none}
        .field:focus{border-color:#6c8cff88}
        .seg{display:flex;gap:6px}
        .seg button{flex:1;padding:7px;border-radius:999px;border:1px solid #ffffff14;background:#ffffff08;color:#eaf0ff;cursor:pointer;font-size:12px}
        .seg button.active{background:#6c8cff;color:#fff;border-color:#6c8cff}
        .btn-primary{width:100%;padding:12px;border-radius:12px;border:0;background:linear-gradient(90deg,#6c8cff,#22d3ee);color:#fff;font-weight:800;cursor:pointer;box-shadow:0 10px 30px #6c8cff44}
        .btn-primary:disabled{opacity:.5;cursor:not-allowed}
        .preview-wrap{position:relative;background:#020617;border-radius:12px;overflow:hidden;min-height:420px;display:grid;place-items:center;border:1px solid #ffffff10}
        .preview-wrap.fs{position:fixed;inset:12px;z-index:50;min-height:auto}
        .toolbar{display:flex;gap:8px;flex-wrap:wrap}
        .tool{padding:7px 10px;border-radius:999px;border:1px solid #ffffff14;background:#ffffff0f;color:#fff;font-size:12px;cursor:pointer}
        .tool:hover{background:#ffffff18}
        .hint{font-size:11px;opacity:.6;margin-top:8px;line-height:1.5}
        pre{margin:0;max-height:420px;overflow:auto;background:#020617;color:#cbd5e1;padding:14px;border-radius:12px;font-size:12px;line-height:1.5}
      `}</style>

      <div className="dev-hero">
        <div style={{display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap",alignItems:"center"}}>
          <div>
            <h1>Game Studio <span style={{background:"linear-gradient(90deg,#6c8cff,#22d3ee)",WebkitBackgroundClip:"text",color:"transparent"}}>— AI</span></h1>
            <p>Describe a game, generate instantly, play in preview. No setup, no MCP — runs in the browser.</p>
          </div>
          <div style={{display:"flex",gap:8}}>
            <span className="badge" style={{background:"#6c8cff22",border:"1px solid #6c8cff44",padding:"6px 10px",borderRadius:999,fontSize:12}}>Instant Preview</span>
            <span className="badge" style={{background:"#22c55e22",border:"1px solid #22c55e44",padding:"6px 10px",borderRadius:999,fontSize:12}}>Single File</span>
          </div>
        </div>
      </div>

      <div className="dev-grid">
        <div className="panel">
          <div className="panel-head"><span>Create</span><span style={{opacity:.5,fontWeight:400}}>/dev</span></div>
          <div className="panel-body" style={{display:"grid",gap:14}}>
            <div>
              <div style={{fontSize:12,opacity:.7,marginBottom:6}}>Templates</div>
              <div className="tpl-grid">
                {TEMPLATES.map(t=>(
                  <div key={t.id} className={"tpl "+(template===t.id?"active":"")} onClick={()=>{setTemplate(t.id); if(!prompt) setPrompt(t.id)}}>
                    <div style={{fontSize:18}}>{t.icon}</div><b>{t.name}</b><span>{t.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label style={{fontSize:12,opacity:.7}}>Prompt</label>
              <textarea className="field" rows={3} value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="e.g. Flappy bird with neon pipes and score" />
              <div style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap"}}>
                {["neon snake with glow","flappy bird retro","pong vs AI","breakout neon bricks"].map(s=>(
                  <button key={s} className="tool" onClick={()=>setPrompt(s)}>{s}</button>
                ))}
              </div>
            </div>

            <div>
              <div style={{fontSize:12,opacity:.7,marginBottom:6}}>Style</div>
              <div className="seg">
                {["neon","retro","minimal"].map(s=>(
                  <button key={s} className={style===s?"active":""} onClick={()=>setStyle(s)}>{s}</button>
                ))}
              </div>
            </div>

            <button className="btn-primary" onClick={()=>gen()} disabled={loading}>
              {loading?"Generating...":"Generate & Play"}
            </button>
            <div className="hint">Tip: try “snake”, “flappy”, “pong”, “breakout”. Output is a single HTML file — download and host anywhere.</div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <span>Preview</span>
            <div className="toolbar">
              <button className="tool" onClick={()=>{if(frameRef.current) frameRef.current.srcdoc=html}}>Refresh</button>
              <button className="tool" onClick={()=>setIsFs(v=>!v)}>{isFs?"Exit":"Fullscreen"}</button>
              <button className="tool" onClick={()=>setShowCode(v=>!v)}>{showCode?"Preview":"Code"}</button>
              <button className="tool" onClick={download}>Download</button>
              <button className="tool" onClick={share}>Share</button>
              <button className="tool" onClick={copyCode}>Copy</button>
            </div>
          </div>
          <div style={{padding:12}}>
            {!showCode ? (
              <div className={"preview-wrap "+(isFs?"fs":"")} style={{height:isFs?"auto":420}}>
                {html ? (
                  <iframe ref={frameRef} title="preview" srcDoc={html} style={{width:"100%",height:"100%",border:0,background:"#020617"}} sandbox="allow-scripts allow-same-origin" />
                ) : (
                  <div style={{textAlign:"center",padding:40}}>
                    <div style={{fontSize:22,marginBottom:8}}>Ready to build</div>
                    <div style={{opacity:.6,fontSize:13,marginBottom:14}}>Pick a template or write a prompt and hit Generate</div>
                    <button className="btn-primary" style={{width:"auto",padding:"10px 18px"}} onClick={()=>gen("snake")}>Try Snake Demo</button>
                  </div>
                )}
              </div>
            ) : (
              <pre>{html || "// Generate a game to see code"}</pre>
            )}
            <div className="hint">Preview runs locally in an iframe (no server roundtrip). Games are keyboard + touch ready. Use Download to get a standalone HTML file.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
