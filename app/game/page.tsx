"use client";
import { useState, useRef, useEffect } from "react";

const IDEAS = [
  "neon snake with glow",
  "flappy bird retro sky",
  "pong vs unbeatable AI",
  "breakout neon bricks",
  "racing neon drift",
];

const STYLES = [
  { id: "neon", name: "Neon", icon: "✦", desc: "Glow" },
  { id: "retro", name: "Retro", icon: "◐", desc: "Arcade" },
  { id: "minimal", name: "Minimal", icon: "○", desc: "Clean" },
];

export default function GameStudio(){
  const [prompt,setPrompt]=useState("");
  const [style,setStyle]=useState("neon");
  const [html,setHtml]=useState("");
  const [loading,setLoading]=useState(false);
  const [showCode,setShowCode]=useState(false);
  const [isFs,setIsFs]=useState(false);
  const [toast,setToast]=useState("");
  const frameRef=useRef<HTMLIFrameElement>(null);
  const taRef=useRef<HTMLTextAreaElement>(null);

  useEffect(()=>{
    const sp=new URLSearchParams(location.search);
    const q=sp.get("prompt");
    if(q){ setPrompt(q); setTimeout(()=>gen(q),400)}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  useEffect(()=>{
    if(!isFs) return;
    const onKey=(e:KeyboardEvent)=>{ if(e.key==="Escape") setIsFs(false)};
    addEventListener("keydown",onKey);
    return()=>removeEventListener("keydown",onKey);
  },[isFs]);

  const showToast=(m:string)=>{ setToast(m); setTimeout(()=>setToast(""),2200)};

  const gen = async (customPrompt?: string)=>{
    const p = (customPrompt||prompt).trim();
    if(!p){ showToast("Write a prompt first"); taRef.current?.focus(); return; }
    if(p.length>800){ showToast("Prompt too long (max 800)"); return; }
    setLoading(true);
    try{
      const r = await fetch("/api/game/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:p, template:"", style})});
      if(r.status===401){ showToast("Login required"); location.href="/login?next="+encodeURIComponent("/game"); return; }
      if(!r.ok) throw new Error("Generate failed "+r.status);
      const j = await r.json();
      if(!j.html) throw new Error("No html returned");
      setHtml(j.html);
      setShowCode(false);
      showToast("Game ready — preview updated");
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
    a.download=(prompt||"game").replace(/[^a-z0-9]+/gi,"-").slice(0,30)+".html";
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
    const url = location.origin+"/game?prompt="+encodeURIComponent(prompt);
    await navigator.clipboard.writeText(url);
    showToast("Link copied");
  };

  const refresh=()=>{
    if(!html) return;
    if(frameRef.current) frameRef.current.srcdoc=html;
  };

  return (
    <>
    <div className="dev-cinematic-bg" aria-hidden="true"><div className="dev-orb dev-orb-a"/><div className="dev-orb dev-orb-b"/><div className="dev-orb dev-orb-c"/><div className="dev-grid-bg"/></div>
    <div style={{maxWidth:1280,margin:"0 auto",position:"relative"}}>
      <style>{`
        .dev-grid-bg{position:absolute;inset:0;background-image:linear-gradient(#ffffff06 1px,transparent 1px),linear-gradient(90deg,#ffffff06 1px,transparent 1px);background-size:44px 44px;mask-image:radial-gradient(700px 380px at 50% 0%,#000,transparent)}
        .cinematic{position:relative;border-radius:24px;overflow:hidden;border:1px solid #ffffff14;background:linear-gradient(180deg,#0e152b 0%,#0a1020 100%);box-shadow:0 30px 80px #0008}
        .cinematic::before{content:"";position:absolute;inset:0;background:radial-gradient(800px 400px at 20% 0%,#6c8cff22,transparent),radial-gradient(600px 300px at 90% 20%,#22d3ee18,transparent);pointer-events:none}
        .cinematic::after{content:"";position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,#6c8cff88,#22d3ee88,transparent)}
        .hero{position:relative;padding:30px 26px 22px;display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;align-items:end}
        .hero h1{font-size:36px;letter-spacing:-.03em;margin:0;line-height:1}
        .hero p{opacity:.65;margin:10px 0 0;font-size:13px;max-width:580px;line-height:1.65}
        .grad-text{background:linear-gradient(90deg,#6c8cff,#22d3ee,#a855f7,#6c8cff);background-size:220% auto;-webkit-background-clip:text;background-clip:text;color:transparent;animation:gradShift 6s linear infinite}
        @keyframes gradShift{to{background-position:220% center}}
        .hero-stats{display:flex;gap:8px;flex-wrap:wrap}
        .chip{padding:6px 10px;border-radius:999px;font-size:11px;font-weight:700;border:1px solid #ffffff14;background:#ffffff0a;letter-spacing:.02em;backdrop-filter:blur(8px)}
        .chip.live{background:#22c55e18;border-color:#22c55e33;color:#86efac;box-shadow:0 0 18px -4px #22c55e66}
        .live-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#22c55e;margin-right:6px;box-shadow:0 0 0 0 #22c55eaa;animation:pulseDot 2s infinite;vertical-align:1px}
        @keyframes pulseDot{70%{box-shadow:0 0 0 7px transparent}100%{box-shadow:0 0 0 0 transparent}}
        .dev-grid{display:grid;grid-template-columns:380px 1fr;gap:16px;margin-top:16px}
        @media(max-width:960px){.dev-grid{grid-template-columns:1fr} .hero h1{font-size:27px}}
        .panel{background:linear-gradient(180deg,#0e152bcc,#0b1226f2);border:1px solid #ffffff14;border-radius:18px;overflow:hidden;box-shadow:0 16px 40px #0005;backdrop-filter:blur(12px)}
        .panel-head{padding:12px 14px;border-bottom:1px solid #ffffff0f;display:flex;justify-content:space-between;align-items:center;font-weight:800;font-size:12px;letter-spacing:.06em;text-transform:uppercase;opacity:.9}
        .panel-body{padding:16px}
        .field{width:100%;padding:12px 13px;border-radius:12px;border:1px solid #ffffff14;background:#020617d9;color:#eaf0ff;outline:none;font-size:13.5px;resize:vertical;line-height:1.55;transition:border-color .2s,box-shadow .2s}
        .field:focus{border-color:#6c8cff88;box-shadow:0 0 0 3px #6c8cff26,0 0 24px -6px #6c8cff66}
        .idea-row{display:flex;gap:6px;margin-top:9px;flex-wrap:wrap}
        .seg{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:5px;background:#020617d9;border:1px solid #ffffff0f;border-radius:14px}
        .seg button{padding:9px 6px;border-radius:10px;border:0;background:transparent;color:#8b9bb8;cursor:pointer;font-size:12px;font-weight:800;transition:.18s;line-height:1.3}
        .seg button small{display:block;font-size:10px;font-weight:600;opacity:.6}
        .seg button:hover{color:#fff;background:#ffffff0a}
        .seg button.active{background:linear-gradient(135deg,#6c8cff,#22d3ee);color:#fff;box-shadow:0 4px 18px #6c8cff55}
        .seg button.active small{opacity:.85}
        .btn-primary{width:100%;padding:14px;border-radius:13px;border:0;background:linear-gradient(90deg,#6c8cff,#22d3ee);color:#fff;font-weight:900;font-size:14px;cursor:pointer;box-shadow:0 10px 30px #6c8cff44;letter-spacing:.02em;transition:.16s;position:relative;overflow:hidden}
        .btn-primary::after{content:"";position:absolute;top:0;left:-70%;width:45%;height:100%;background:linear-gradient(100deg,transparent,#ffffff77,transparent);transform:skewX(-20deg);animation:shineBtn 3.8s ease-in-out infinite}
        @keyframes shineBtn{0%,55%{left:-70%}100%{left:180%}}
        .btn-primary:hover{transform:translateY(-1px);box-shadow:0 14px 40px #6c8cff66}
        .btn-primary:disabled{opacity:.6;cursor:wait;transform:none}
        .kbd{font-family:ui-monospace,monospace;font-size:10px;border:1px solid #ffffff22;border-bottom-width:2px;border-radius:6px;padding:1px 5px;background:#ffffff0a;color:#cbd5e1}
        .preview-glow{padding:1.5px;border-radius:16px;background:linear-gradient(135deg,#6c8cff66,#22d3ee44,#a855f755);box-shadow:0 0 40px -12px #6c8cff88}
        .preview-wrap{position:relative;background:#020617;border-radius:14px;overflow:hidden;min-height:480px;display:grid;place-items:center;border:1px solid #ffffff10;box-shadow:inset 0 1px 0 #ffffff0a}
        .preview-wrap.fs{position:fixed;inset:12px;z-index:50;min-height:auto;border-radius:16px}
        .toolbar{display:flex;gap:6px;flex-wrap:wrap}
        .tool{padding:7px 11px;border-radius:999px;border:1px solid #ffffff14;background:#ffffff0a;color:#fff;font-size:11px;font-weight:700;cursor:pointer;backdrop-filter:blur(8px);transition:.15s}
        .tool:hover{background:#6c8cff22;border-color:#6c8cff55;box-shadow:0 0 16px -4px #6c8cff88}
        .tool:active{transform:scale(.97)}
        .hint{font-size:11px;opacity:.55;margin-top:9px;line-height:1.65}
        pre{margin:0;max-height:480px;overflow:auto;background:#020617;color:#cbd5e1;padding:14px;border-radius:12px;font-size:12px;line-height:1.6;border:1px solid #ffffff0f}
        .toast{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);background:#0e152bf2;border:1px solid #6c8cff44;color:#fff;padding:10px 16px;border-radius:999px;font-size:12px;font-weight:700;box-shadow:0 10px 30px #0008,0 0 24px -8px #6c8cff88;z-index:60;animation:toastIn .25s ease}
        @keyframes toastIn{from{opacity:0;transform:translate(-50%,8px)}to{opacity:1;transform:translate(-50%,0)}}
        .skeleton{width:100%;height:100%;display:grid;place-items:center;gap:12px;padding:32px;text-align:center}
        .pulse{width:52px;height:52px;border-radius:50%;background:conic-gradient(from 0deg,#6c8cff,#22d3ee,#a855f7,#6c8cff);animation:spin 1s linear infinite;mask:radial-gradient(circle 19px at 50% 50%,transparent 98%,black 100%);-webkit-mask:radial-gradient(circle 19px at 50% 50%,transparent 98%,black 100%)}
        @keyframes spin{to{transform:rotate(360deg)}}
        .empty-art{font-size:44px;filter:drop-shadow(0 0 18px #6c8cff88);animation:floatY 4s ease-in-out infinite}
        @keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        .label{font-size:11px;opacity:.6;letter-spacing:.07em;font-weight:800;margin-bottom:7px;display:flex;justify-content:space-between;align-items:center}
      `}</style>

      <div className="cinematic">
        <div className="hero">
          <div>
            <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:12,flexWrap:"wrap"}}>
              <span className="chip live"><span className="live-dot"/>LIVE PREVIEW</span>
              <span className="chip">No deploy needed</span>
              <span className="chip">Single file</span>
            </div>
            <h1>Game Studio <span className="grad-text">— Instant Play</span></h1>
            <p>Describe any game in plain English. AI instantly crafts a playable HTML file — preview, tweak, download. Runs 100% in your browser. Press <span className="kbd">Ctrl</span> + <span className="kbd">Enter</span> to generate.</p>
          </div>
          <div className="hero-stats">
            <span className="chip">⚡ Instant</span>
            <span className="chip">🎮 Playable</span>
            <span className="chip">📦 One file</span>
          </div>
        </div>
      </div>

      <div className="dev-grid">
        <div className="panel">
          <div className="panel-head"><span>✦ Create</span><span style={{opacity:.5,fontWeight:600}}>/game</span></div>
          <div className="panel-body" style={{display:"grid",gap:16}}>
            <div>
              <div className="label"><span>DESCRIBE YOUR GAME</span><span style={{opacity:.6}}>{prompt.length}/800</span></div>
              <textarea ref={taRef} className="field" rows={4} value={prompt} onChange={e=>setPrompt(e.target.value)} onKeyDown={e=>{ if((e.ctrlKey||e.metaKey)&&e.key==="Enter") gen(); }} placeholder="e.g. Neon snake with glow, wrap walls and swipe controls…" maxLength={800} />
              <div className="idea-row">
                {IDEAS.map(s=>(
                  <button key={s} className="tool" onClick={()=>setPrompt(s)}>{s}</button>
                ))}
              </div>
            </div>

            <div>
              <div className="label"><span>STYLE</span></div>
              <div className="seg">
                {STYLES.map(s=>(
                  <button key={s.id} className={style===s.id?"active":""} onClick={()=>setStyle(s.id)}>{s.icon} {s.name}<small>{s.desc}</small></button>
                ))}
              </div>
            </div>

            <button className="btn-primary" onClick={()=>gen()} disabled={loading}>
              {loading?"Crafting…":"Generate & Play →"}
            </button>
            <div className="hint">Tip: be specific — “snake with walls wrap and touch swipe” beats “make a game”. <span className="kbd">Ctrl</span>+<span className="kbd">Enter</span> works too.</div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <span>▶ Preview</span>
            <div className="toolbar">
              <button className="tool" onClick={refresh} title="Refresh">↻ Refresh</button>
              <button className="tool" onClick={()=>setIsFs(v=>!v)}>{isFs?"Exit":"⛶ Fullscreen"}</button>
              <button className="tool" onClick={()=>setShowCode(v=>!v)}>{showCode?"Preview":"Code"}</button>
              <button className="tool" onClick={download}>⤓ Download</button>
              <button className="tool" onClick={share}>⧉ Share</button>
              <button className="tool" onClick={copyCode}>⧉ Copy</button>
            </div>
          </div>
          <div style={{padding:12}}>
            {!showCode ? (
              <div className="preview-glow">
              <div className={"preview-wrap "+(isFs?"fs":"")} style={{height:isFs?"auto":480}}>
                {loading ? (
                  <div className="skeleton"><div className="pulse"/><div style={{fontWeight:800}}>Crafting your game…</div><div style={{opacity:.6,fontSize:12}}>Instant — no cloud wait</div></div>
                ) : html ? (
                  <iframe ref={frameRef} title="preview" srcDoc={html} style={{width:"100%",height:"100%",border:0,background:"#020617"}} sandbox="allow-scripts allow-same-origin allow-pointer-lock" allow="fullscreen" />
                ) : (
                  <div style={{textAlign:"center",padding:36,position:"relative"}}>
                    <div className="empty-art">🕹️</div>
                    <div style={{fontSize:22,fontWeight:800,margin:"10px 0 6px"}}>Ready to build</div>
                    <div style={{opacity:.6,fontSize:13,marginBottom:18}}>Write a prompt above and hit Generate</div>
                    <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
                      <button className="btn-primary" style={{width:"auto",padding:"10px 20px"}} onClick={()=>{setPrompt("neon snake with glow");gen("neon snake with glow")}}>Try Snake</button>
                      <button className="tool" onClick={()=>{setPrompt("flappy bird retro sky");gen("flappy bird retro sky")}}>Try Flappy</button>
                      <button className="tool" onClick={()=>{setPrompt("racing neon drift");gen("racing neon drift")}}>Try Racing</button>
                    </div>
                  </div>
                )}
              </div>
              </div>
            ) : (
              <pre>{html || "// Generate a game to see code"}</pre>
            )}
            <div className="hint">Preview runs locally in an iframe. Keyboard + touch ready. Download gives you a standalone HTML file.</div>
          </div>
        </div>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
    </>
  );
}
