"use client";
import { useState, useRef, useEffect } from "react";

const TEMPLATES = [
  { id:"snake", name:"Snake", desc:"Neon trail", icon:"S", color:"#22d3ee", accent:"#06b6d4" },
  { id:"flappy", name:"Flappy", desc:"Sky dash", icon:"F", color:"#fde047", accent:"#eab308" },
  { id:"pong", name:"Pong", desc:"Duel", icon:"P", color:"#6c8cff", accent:"#818cf8" },
  { id:"breakout", name:"Breakout", desc:"Brick blast", icon:"B", color:"#a855f7", accent:"#c084fc" },
  { id:"racing", name:"Racing", desc:"Neon drift", icon:"R", color:"#ef4444", accent:"#f87171" },
  { id:"generic", name:"Particles", desc:"Burst FX", icon:"*", color:"#f59e0b", accent:"#fbbf24" },
];

export default function DevStudio(){
  const [prompt,setPrompt]=useState("");
  const [template,setTemplate]=useState("snake");
  const [style,setStyle]=useState("neon");
  const [html,setHtml]=useState("");
  const [loading,setLoading]=useState(false);
  const [showCode,setShowCode]=useState(false);
  const [isFs,setIsFs]=useState(false);
  const [toast,setToast]=useState("");
  const frameRef=useRef<HTMLIFrameElement>(null);

  useEffect(()=>{
    const sp=new URLSearchParams(location.search);
    const q=sp.get("prompt");
    if(q){ setPrompt(q); setTimeout(()=>gen(q),400)}
  },[]);

  useEffect(()=>{
    if(!isFs) return;
    const onKey=(e:KeyboardEvent)=>{ if(e.key==="Escape") setIsFs(false)};
    addEventListener("keydown",onKey);
    return()=>removeEventListener("keydown",onKey);
  },[isFs]);

  const showToast=(m:string)=>{ setToast(m); setTimeout(()=>setToast(""),2200)};

  const gen = async (customPrompt?: string)=>{
    const p = (customPrompt||prompt||template).trim();
    if(!p){ showToast("Write a prompt first"); return; }
    if(p.length>800){ showToast("Prompt too long (max 800)"); return; }
    setLoading(true);
    try{
      const r = await fetch("/api/dev/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:p, template, style})});
      if(!r.ok) throw new Error("Generate failed "+r.status);
      const j = await r.json();
      if(!j.html) throw new Error("No html returned");
      setHtml(j.html);
      setShowCode(false);
      showToast("Game ready â preview updated");
    }catch(e:any){
      showToast(e.message||"Failed");
    }
    setLoading(false);
  };

  const download = ()=>{
    if(!html){ showToast("Generate first"); return; }
    const blob=new Blob([html],{type:"text/html"});
    const a=document.createElement("a");
    const url=URL.createObjectURL(blob);
    a.href=url;
    a.download=(prompt||template||"game").replace(/[^a-z0-9]+/gi,"-").slice(0,30)+".html";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    showToast("Downloaded");
  };

  const copyCode=async()=>{
    if(!html){ showToast("Nothing to copy"); return; }
    await navigator.clipboard.writeText(html);
    showToast("Code copied");
  };

  const share=async()=>{
    const url = location.origin+"/dev?prompt="+encodeURIComponent(prompt||template);
    await navigator.clipboard.writeText(url);
    showToast("Link copied");
  };

  const refresh=()=>{
    if(!html) return;
    if(frameRef.current) frameRef.current.srcdoc=html;
  };

  return (
    <>
    <div className="dev-cinematic-bg" aria-hidden="true"><div className="dev-orb dev-orb-a"/><div className="dev-orb dev-orb-b"/><div className="dev-orb dev-orb-c"/></div>
    <div style={{maxWidth:1280,margin:"0 auto",position:"relative"}}>
      <style>{`
        .cinematic{position:relative;border-radius:24px;overflow:hidden;border:1px solid #ffffff14;background:linear-gradient(180deg,#0e152b 0%,#0a1020 100%);box-shadow:0 30px 80px #0008}
        .cinematic::before{content:"";position:absolute;inset:0;background:radial-gradient(800px 400px at 20% 0%,#6c8cff22,transparent),radial-gradient(600px 300px at 90% 20%,#22d3ee18,transparent);pointer-events:none}
        .hero{position:relative;padding:28px 24px 20px;display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;align-items:end}
        .hero h1{font-size:34px;letter-spacing:-.03em;margin:0;line-height:1}
        .hero p{opacity:.65;margin:8px 0 0;font-size:13px;max-width:560px;line-height:1.6}
        .hero-stats{display:flex;gap:8px;flex-wrap:wrap}
        .chip{padding:6px 10px;border-radius:999px;font-size:11px;font-weight:700;border:1px solid #ffffff14;background:#ffffff0a;letter-spacing:.02em}
        .chip.live{background:#22c55e18;border-color:#22c55e33;color:#86efac}
        .dev-grid{display:grid;grid-template-columns:380px 1fr;gap:16px;margin-top:16px}
        @media(max-width:960px){.dev-grid{grid-template-columns:1fr} .hero h1{font-size:26px}}
        .panel{background:linear-gradient(180deg,#0e152b,#0b1226);border:1px solid #ffffff14;border-radius:16px;overflow:hidden;box-shadow:0 16px 40px #0005}
        .panel-head{padding:12px 14px;border-bottom:1px solid #ffffff0f;display:flex;justify-content:space-between;align-items:center;font-weight:800;font-size:12px;letter-spacing:.04em;text-transform:uppercase;opacity:.9}
        .panel-body{padding:14px}
        .tpl-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
        @media(max-width:520px){.tpl-grid{grid-template-columns:repeat(2,1fr)}}
        .tpl{padding:10px 10px 12px;border-radius:14px;border:1px solid #ffffff12;background:linear-gradient(180deg,#ffffff08,#ffffff03);cursor:pointer;transition:.18s;position:relative;overflow:hidden}
        .tpl::after{content:"";position:absolute;inset:0;background:radial-gradient(300px 120px at 50% 0%,var(--accent, #6c8cff22),transparent);opacity:0;transition:.18s}
        .tpl:hover{transform:translateY(-2px);border-color:#ffffff22}
        .tpl:hover::after{opacity:1}
        .tpl.active{outline:2px solid var(--accent, #6c8cff);background:linear-gradient(180deg,#6c8cff18,#6c8cff0a)}
        .tpl b{display:block;font-size:12px;margin-top:6px}
        .tpl span{font-size:10px;opacity:.6}
        .field{width:100%;padding:11px 12px;border-radius:12px;border:1px solid #ffffff14;background:#020617;color:#eaf0ff;outline:none;font-size:13px;resize:vertical}
        .field:focus{border-color:#6c8cff66;box-shadow:0 0 0 3px #6c8cff22}
        .seg{display:flex;gap:6px;padding:4px;background:#020617;border:1px solid #ffffff0f;border-radius:999px}
        .seg button{flex:1;padding:7px;border-radius:999px;border:0;background:transparent;color:#8b9bb8;cursor:pointer;font-size:12px;font-weight:700}
        .seg button.active{background:#6c8cff;color:#fff;box-shadow:0 4px 16px #6c8cff44}
        .btn-primary{width:100%;padding:13px;border-radius:12px;border:0;background:linear-gradient(90deg,#6c8cff,#22d3ee);color:#fff;font-weight:900;cursor:pointer;box-shadow:0 10px 30px #6c8cff44;letter-spacing:.02em;transition:.15s}
        .btn-primary:hover{transform:translateY(-1px);box-shadow:0 14px 36px #6c8cff55}
        .btn-primary:disabled{opacity:.5;cursor:not-allowed;transform:none}
        .preview-wrap{position:relative;background:#020617;border-radius:14px;overflow:hidden;min-height:460px;display:grid;place-items:center;border:1px solid #ffffff10;box-shadow:inset 0 1px 0 #ffffff0a}
        .preview-wrap.fs{position:fixed;inset:12px;z-index:50;min-height:auto;border-radius:16px}
        .toolbar{display:flex;gap:6px;flex-wrap:wrap}
        .tool{padding:7px 10px;border-radius:999px;border:1px solid #ffffff14;background:#ffffff0a;color:#fff;font-size:11px;font-weight:700;cursor:pointer;backdrop-filter:blur(8px)}
        .tool:hover{background:#ffffff14}
        .tool:active{transform:scale(.98)}
        .hint{font-size:11px;opacity:.55;margin-top:8px;line-height:1.6}
        pre{margin:0;max-height:460px;overflow:auto;background:#020617;color:#cbd5e1;padding:14px;border-radius:12px;font-size:12px;line-height:1.6;border:1px solid #ffffff0f}
        .toast{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);background:#0e152b;border:1px solid #ffffff14;color:#fff;padding:10px 14px;border-radius:999px;font-size:12px;font-weight:700;box-shadow:0 10px 30px #0006;z-index:60}
        .skeleton{width:100%;height:100%;display:grid;place-items:center;gap:12px;padding:32px;text-align:center}
        .pulse{width:48px;height:48px;border-radius:50%;background:conic-gradient(from 0deg,#6c8cff,#22d3ee,#6c8cff);animation:spin 1s linear infinite;mask:radial-gradient(circle 18px at 50% 50%,transparent 98%,black 100%)}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      <div className="cinematic">
        <div className="hero">
          <div>
            <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:10}}>
              <span className="chip live">â LIVE PREVIEW</span>
              <span className="chip">No deploy needed</span>
              <span className="chip">Single file</span>
            </div>
            <h1>Game Studio <span style={{background:"linear-gradient(90deg,#6c8cff,#22d3ee)",WebkitBackgroundClip:"text",color:"transparent"}}>â Cinematic</span></h1>
            <p>Describe any game in plain English. AI instantly crafts a playable HTML file â preview, tweak, download. Runs 100% in your browser.</p>
          </div>
          <div className="hero-stats">
            <span className="chip">â¡ Instant</span>
            <span className="chip">ð® Playable</span>
            <span className="chip">ð¦ One file</span>
          </div>
        </div>
      </div>

      <div className="dev-grid">
        <div className="panel">
          <div className="panel-head"><span>Create</span><span style={{opacity:.5,fontWeight:600}}>/dev</span></div>
          <div className="panel-body" style={{display:"grid",gap:14}}>
            <div>
              <div style={{fontSize:11,opacity:.6,marginBottom:8,letterSpacing:".06em",fontWeight:800}}>TEMPLATES</div>
              <div className="tpl-grid">
                {TEMPLATES.map(t=>(
                  <div key={t.id} className={"tpl "+(template===t.id?"active":"")} style={{"--accent":t.accent} as any} onClick={()=>{setTemplate(t.id); if(!prompt) setPrompt(t.id)}}>
                    <div style={{width:28,height:28,borderRadius:8,background:t.color,display:"grid",placeItems:"center",fontWeight:900,color:"#020617",fontSize:13}}>{t.icon}</div>
                    <b>{t.name}</b><span>{t.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label style={{fontSize:11,opacity:.6,letterSpacing:".06em",fontWeight:800}}>PROMPT</label>
              <textarea className="field" rows={3} value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="e.g. Flappy bird with neon pipes, particles and score" maxLength={800} />
              <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
                {["neon snake with glow","flappy bird retro sky","pong vs unbeatable AI","breakout neon bricks","racing neon drift"].map(s=>(
                  <button key={s} className="tool" onClick={()=>setPrompt(s)}>{s}</button>
                ))}
              </div>
              <div style={{fontSize:10,opacity:.45,marginTop:4}}>{prompt.length}/800</div>
            </div>

            <div>
              <div style={{fontSize:11,opacity:.6,marginBottom:6,letterSpacing:".06em",fontWeight:800}}>STYLE</div>
              <div className="seg">
                {["neon","retro","minimal"].map(s=>(
                  <button key={s} className={style===s?"active":""} onClick={()=>setStyle(s)}>{s}</button>
                ))}
              </div>
            </div>

            <button className="btn-primary" onClick={()=>gen()} disabled={loading}>
              {loading?"Generatingâ¦":"Generate & Play â"}
            </button>
            <div className="hint">Tip: be specific â âsnake with walls wrap and touch swipeâ works better than âmake a gameâ.</div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <span>Preview</span>
            <div className="toolbar">
              <button className="tool" onClick={refresh} title="Refresh">â» Refresh</button>
              <button className="tool" onClick={()=>setIsFs(v=>!v)}>{isFs?"Exit":"â¶ Fullscreen"}</button>
              <button className="tool" onClick={()=>setShowCode(v=>!v)}>{showCode?"Preview":"Code"}</button>
              <button className="tool" onClick={download}>Download</button>
              <button className="tool" onClick={share}>Share</button>
              <button className="tool" onClick={copyCode}>Copy</button>
            </div>
          </div>
          <div style={{padding:12}}>
            {!showCode ? (
              <div className={"preview-wrap "+(isFs?"fs":"")} style={{height:isFs?"auto":460}}>
                {loading ? (
                  <div className="skeleton"><div className="pulse"/><div style={{fontWeight:800}}>Crafting your gameâ¦</div><div style={{opacity:.6,fontSize:12}}>This is instant â no cloud wait</div></div>
                ) : html ? (
                  <iframe ref={frameRef} title="preview" srcDoc={html} style={{width:"100%",height:"100%",border:0,background:"#020617"}} sandbox="allow-scripts allow-same-origin allow-pointer-lock" allow="fullscreen" />
                ) : (
                  <div style={{textAlign:"center",padding:36}}>
                    <div style={{fontSize:28,marginBottom:8}}>Ready to build</div>
                    <div style={{opacity:.6,fontSize:13,marginBottom:16}}>Pick a template or write a prompt and hit Generate</div>
                    <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
                      <button className="btn-primary" style={{width:"auto",padding:"10px 18px"}} onClick={()=>gen("snake")}>Try Snake</button>
                      <button className="tool" onClick={()=>gen("flappy")}>Try Flappy</button>
                      <button className="tool" onClick={()=>gen("racing")}>Try Racing</button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <pre>{html || "// Generate a game to see code"}</pre>
            )}
            <div className="hint">Preview runs locally in an iframe. All games are keyboard + touch + gamepad ready. Download gives you a standalone HTML file.</div>
          </div>
        </div>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
    </>
  );
}
