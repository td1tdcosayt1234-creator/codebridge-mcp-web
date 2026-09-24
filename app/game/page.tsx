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


const GAME_CSS = `
        .dev-grid-bg{position:absolute;inset:0;background-image:linear-gradient(#ffffff08 1px,transparent 1px),linear-gradient(90deg,#ffffff08 1px,transparent 1px);background-size:52px 52px;mask-image:radial-gradient(760px 400px at 50% 0%,#000,transparent);animation:gridDrift 18s linear infinite}
        @keyframes gridDrift{to{background-position:0 52px,0 0}}
        .cinematic{position:relative;border-radius:26px;overflow:hidden;border:1px solid #ffffff1f;background:linear-gradient(180deg,rgba(16,14,32,.92) 0%,rgba(6,7,14,.96) 100%);box-shadow:0 44px 100px -50px #000,0 0 90px -50px #8b5cf6;backdrop-filter:blur(16px)}
        .cinematic::before{content:"";position:absolute;inset:0;background:radial-gradient(820px 420px at 18% -10%,#8b5cf647,transparent),radial-gradient(640px 320px at 92% 16%,#2dd4bf33,transparent);pointer-events:none}
        .cinematic::after{content:"";position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,#c4b5fdcc,#5eead4cc,transparent);box-shadow:0 0 22px #8b5cf699}
        .hero{position:relative;padding:34px 30px 24px;display:flex;justify-content:space-between;gap:18px;flex-wrap:wrap;align-items:end}
        .hero h1{font-size:38px;letter-spacing:-.04em;margin:0;line-height:1.02;font-weight:700}
        .hero p{color:#99a1b8;margin:12px 0 0;font-size:13.5px;max-width:600px;line-height:1.7}
        .grad-text{background:linear-gradient(100deg,#c4b5fd,#38bdf8 45%,#5eead4);background-size:220% auto;-webkit-background-clip:text;background-clip:text;color:transparent;animation:gradShift 8s linear infinite;text-shadow:0 0 50px #8b5cf655}
        @keyframes gradShift{to{background-position:220% center}}
        .hero-stats{display:flex;gap:8px;flex-wrap:wrap}
        .chip{padding:6px 11px;border-radius:999px;font-size:11px;font-weight:700;border:1px solid #ffffff17;background:#ffffff0d;color:#b9c0d4;letter-spacing:.02em;backdrop-filter:blur(10px);transition:.3s}
        .chip:hover{border-color:#c4b5fd66;color:#fff;transform:translateY(-2px)}
        .chip.live{background:#34d3991f;border-color:#34d3994d;color:#6ee7b7;box-shadow:0 0 22px -6px #34d399aa}
        .live-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#34d399;margin-right:6px;box-shadow:0 0 0 0 #34d399aa;animation:pulseDot 2s infinite;vertical-align:1px}
        @keyframes pulseDot{70%{box-shadow:0 0 0 8px transparent}100%{box-shadow:0 0 0 0 transparent}}
        .dev-grid{display:grid;grid-template-columns:390px 1fr;gap:18px;margin-top:18px}
        @media(max-width:980px){.dev-grid{grid-template-columns:1fr} .hero h1{font-size:28px}}
        .panel{background:linear-gradient(180deg,rgba(18,20,34,.78),rgba(7,8,16,.9));border:1px solid #ffffff17;border-radius:20px;overflow:hidden;box-shadow:0 30px 70px -50px #000,inset 0 1px 0 #ffffff0d;backdrop-filter:blur(14px)}
        .panel-head{padding:13px 15px;border-bottom:1px solid #ffffff12;display:flex;justify-content:space-between;align-items:center;gap:10px;font-weight:800;font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;color:#b9c0d4}
        .panel-body{padding:18px}
        .field{width:100%;padding:13px 14px;border-radius:13px;border:1px solid #ffffff1a;background:#04060fd9;color:#f5f6fb;outline:none;font-size:13.5px;resize:vertical;line-height:1.6;transition:border-color .25s,box-shadow .3s,background .25s}
        .field:focus{border-color:#c4b5fdaa;background:#0a0c1ae6;box-shadow:0 0 0 4px #8b5cf626,0 0 40px -14px #8b5cf6}
        .idea-row{display:flex;gap:7px;margin-top:10px;flex-wrap:wrap}
        .seg{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:6px;background:#04060fd9;border:1px solid #ffffff12;border-radius:15px}
        .seg button{padding:10px 6px;border-radius:11px;border:0;background:transparent;color:#8b93a8;cursor:pointer;font-size:12px;font-weight:800;transition:.25s;line-height:1.3}
        .seg button small{display:block;font-size:10px;font-weight:600;opacity:.6}
        .seg button:hover{color:#fff;background:#ffffff0d}
        .seg button.active{background:linear-gradient(135deg,#8b5cf6,#2dd4bf);color:#08091a;box-shadow:0 8px 26px -10px #8b5cf6}
        .seg button.active small{opacity:.8}
        .btn-primary{width:100%;padding:15px;border-radius:14px;border:1px solid #ffffff1f;background:linear-gradient(110deg,#f5f6fb,#e4e6f5);color:#07080f;font-weight:800;font-size:14px;cursor:pointer;box-shadow:0 16px 40px -20px #fff;letter-spacing:.01em;transition:.3s;position:relative;overflow:hidden}
        .btn-primary::after{content:"";position:absolute;top:0;left:-70%;width:45%;height:100%;background:linear-gradient(100deg,transparent,#ffffff99,transparent);transform:skewX(-20deg);animation:shineBtn 4.2s ease-in-out infinite}
        @keyframes shineBtn{0%,55%{left:-70%}100%{left:180%}}
        .btn-primary:hover{transform:translateY(-2px);box-shadow:0 22px 50px -22px #c4b5fd}
        .btn-primary:disabled{opacity:.6;cursor:wait;transform:none}
        .kbd{font-family:ui-monospace,monospace;font-size:10px;border:1px solid #ffffff26;border-bottom-width:2px;border-radius:6px;padding:1.5px 6px;background:#ffffff0d;color:#d7dced}
        .preview-glow{padding:1.5px;border-radius:18px;background:conic-gradient(from 0deg,#8b5cf6aa,#2dd4bf88,#38bdf888,#8b5cf6aa);box-shadow:0 0 60px -18px #8b5cf6;animation:spin 14s linear infinite}
        .preview-wrap{position:relative;background:#04060f;border-radius:15px;overflow:hidden;min-height:480px;display:grid;place-items:center;border:1px solid #ffffff12;box-shadow:inset 0 1px 0 #ffffff0d}
        .preview-wrap.fs{position:fixed;inset:12px;z-index:50;min-height:auto;border-radius:18px}
        .toolbar{display:flex;gap:6px;flex-wrap:wrap}
        .tool{padding:7px 12px;border-radius:999px;border:1px solid #ffffff17;background:#ffffff0d;color:#e6e9f5;font-size:11px;font-weight:700;cursor:pointer;backdrop-filter:blur(10px);transition:.25s}
        .tool:hover{background:#8b5cf633;border-color:#c4b5fd77;box-shadow:0 0 20px -6px #8b5cf6;transform:translateY(-1px)}
        .tool:active{transform:scale(.97)}
        .hint{font-size:11px;color:#6a7288;margin-top:10px;line-height:1.7}
        pre{margin:0;max-height:480px;overflow:auto;background:#04060f;color:#ccd3e8;padding:16px;border-radius:13px;font-size:12px;line-height:1.7;border:1px solid #ffffff12}
        .toast{position:fixed;bottom:18px;left:50%;transform:translateX(-50%);background:rgba(12,14,24,.97);border:1px solid #c4b5fd66;color:#fff;padding:11px 18px;border-radius:999px;font-size:12px;font-weight:700;box-shadow:0 20px 50px -20px #000,0 0 40px -14px #8b5cf6;z-index:60;animation:toastIn .3s cubic-bezier(.34,1.56,.64,1)}
        @keyframes toastIn{from{opacity:0;transform:translate(-50%,10px) scale(.96)}to{opacity:1;transform:translate(-50%,0) scale(1)}}
        .skeleton{width:100%;height:100%;display:grid;place-items:center;gap:14px;padding:32px;text-align:center}
        .pulse{width:56px;height:56px;border-radius:50%;background:conic-gradient(from 0deg,#8b5cf6,#2dd4bf,#38bdf8,#8b5cf6);animation:spin 1.1s linear infinite;mask:radial-gradient(circle 20px at 50% 50%,transparent 98%,black 100%);-webkit-mask:radial-gradient(circle 20px at 50% 50%,transparent 98%,black 100%);box-shadow:0 0 40px -10px #8b5cf6}
        @keyframes spin{to{transform:rotate(360deg)}}
        .empty-art{font-size:44px;filter:drop-shadow(0 0 22px #8b5cf6aa);animation:floatY 4.5s ease-in-out infinite}
        @keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        .label{font-size:10.5px;color:#6a7288;letter-spacing:.14em;font-weight:800;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;text-transform:uppercase}
`;

export default function GameStudio(){
  const [prompt,setPrompt]=useState("");
  const [style,setStyle]=useState("neon");
  const [html,setHtml]=useState("");
  const [provider,setProvider]=useState("");
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
      const r = await fetch("/api/game/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:p, style})});
      if(r.status===401){ showToast("Login required"); location.href="/login?next="+encodeURIComponent("/game"); return; }
      if(r.status===503){ showToast("AI busy — wait a minute and retry"); setLoading(false); return; }
      if(!r.ok) throw new Error("Generate failed "+r.status);
      const j = await r.json();
      if(!j.html) throw new Error("No html returned");
      setHtml(j.html);
      setShowCode(false);
      setProvider(j.provider || "ai");
      showToast("AI game ready — preview updated");
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
      <style dangerouslySetInnerHTML={{ __html: GAME_CSS }} />

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
            <span>▶ Preview{provider ? ` · ${provider}` : ""}</span>
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
