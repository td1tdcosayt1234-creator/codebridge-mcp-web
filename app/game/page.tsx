"use client";
import { useState, useRef, useEffect } from "react";

const IDEAS = [
  "neon snake with glow",
  "flappy bird retro sky",
  "pong vs unbeatable AI",
  "breakout neon bricks",
  "racing neon drift",
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
        select.field{cursor:pointer}
        select.field option{background:#0a0c1a;color:#f5f6fb}
        .idea-row{display:flex;gap:7px;margin-top:10px;flex-wrap:wrap}
        .chat-thread{display:flex;flex-direction:column;gap:10px;max-height:300px;overflow-y:auto;padding:4px 2px}
        .msg{padding:10px 13px;border-radius:13px;font-size:13px;line-height:1.65;max-width:100%;white-space:pre-wrap;word-break:break-word}
        .msg-user{background:linear-gradient(135deg,#8b5cf633,#2dd4bf22);border:1px solid #8b5cf64d;color:#eef;align-self:flex-end;border-bottom-right-radius:4px}
        .msg-ai{background:#ffffff0a;border:1px solid #ffffff14;color:#c6cddd;align-self:flex-start;border-bottom-left-radius:4px}
        .msg-ai.err{border-color:#f8717155;color:#fca5a5}
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
        .stage-bar{width:min(320px,80%);height:8px;border-radius:99px;background:#ffffff14;border:1px solid #ffffff1a;overflow:hidden;margin-top:6px}
        .stage-fill{height:100%;border-radius:99px;background:linear-gradient(90deg,#8b5cf6,#38bdf8,#5eead4,#8b5cf6);background-size:220% auto;animation:gradShift 2.2s linear infinite,fillSlide .5s ease;transition:width .6s cubic-bezier(.34,1.3,.64,1);box-shadow:0 0 16px #8b5cf6aa}
        @keyframes fillSlide{from{filter:brightness(1.8)}to{filter:brightness(1)}}
        .stage-list{display:flex;flex-direction:column;gap:5px;margin-top:10px;width:min(320px,84%)}
        .stage-row{display:flex;align-items:center;gap:9px;font-size:12.5px;font-weight:700;padding:7px 12px;border-radius:11px;border:1px solid transparent;animation:stageIn .45s cubic-bezier(.34,1.4,.64,1);transition:.3s}
        @keyframes stageIn{from{opacity:0;transform:translateY(8px) scale(.97)}to{opacity:1;transform:none}}
        .stage-row.done{color:#6ee7b7;background:#34d39912;border-color:#34d3992e}
        .stage-row.active{color:#fff;background:linear-gradient(135deg,#8b5cf633,#2dd4bf22);border-color:#c4b5fd55;box-shadow:0 0 24px -8px #8b5cf6}
        .stage-row.todo{color:#5b6378;background:#ffffff06}
        .stage-ico{width:18px;text-align:center}
        @keyframes stagePop{0%{opacity:0;transform:translateY(14px) scale(.9)}60%{transform:translateY(-3px) scale(1.03)}100%{opacity:1;transform:none}}
        @keyframes icoBounce{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-5px) scale(1.15)}}
        .stage-dots span{display:inline-block;animation:blinkDot 1.2s infinite}
        .stage-dots span:nth-child(2){animation-delay:.2s}
        .stage-dots span:nth-child(3){animation-delay:.4s}
        @keyframes blinkDot{0%,60%,100%{opacity:.2;transform:none}30%{opacity:1;transform:translateY(-2px)}}
`;

type Msg = { role: "user" | "ai"; text: string; err?: boolean };

// Live build stages shown while the AI works (timed, honest labels).
const STAGES = [
  { at: 0, icon: "📋", en: "Preparing", bn: "idea sajano hocche" },
  { at: 8, icon: "🎨", en: "Designing", bn: "look + level design" },
  { at: 20, icon: "💻", en: "Coding", bn: "game code likhche" },
  { at: 45, icon: "🔧", en: "Fixing", bn: "bug fix + test" },
  { at: 70, icon: "✏️", en: "Editing", bn: "tune + balance" },
  { at: 95, icon: "✨", en: "Modifying", bn: "juice + polish" },
  { at: 130, icon: "🚀", en: "Finalizing", bn: "final file ready hocche" },
];
const stageFor = (sec: number) => {
  let i = 0;
  STAGES.forEach((s, k) => { if (sec >= s.at) i = k; });
  return i;
};

export default function GameStudio(){
  const [msgs,setMsgs]=useState<Msg[]>([]);
  const [input,setInput]=useState("");
  const [context,setContext]=useState("");
  const [models,setModels]=useState<string[]>([]);
  const [modelSel,setModelSel]=useState("auto");
  const [html,setHtml]=useState("");
  const [provider,setProvider]=useState("");
  const [loading,setLoading]=useState(false);
  const [stageIdx,setStageIdx]=useState(0);
  const [elapsed,setElapsed]=useState(0);
  const [kiloModels,setKiloModels]=useState<string[]>([]);
  const [showCode,setShowCode]=useState(false);
  const [isFs,setIsFs]=useState(false);
  const [toast,setToast]=useState("");
  // Plan-before-build + History
  const [plan,setPlan]=useState("");
  const [planLoading,setPlanLoading]=useState(false);
  const [showHistory,setShowHistory]=useState(false);
  type HistItem = { id:string; prompt:string; plan:string; provider:string; model:string; htmlSize:number; summary:string; createdAt:string };
  const [history,setHistory]=useState<HistItem[]>([]);
  const [histLoading,setHistLoading]=useState(false);
  const frameRef=useRef<HTMLIFrameElement>(null);
  const taRef=useRef<HTMLTextAreaElement>(null);
  const threadRef=useRef<HTMLDivElement>(null);
  const genBusy=useRef(false);
  const autoRan=useRef(false);

  useEffect(()=>{
    threadRef.current?.scrollTo({top: 999999});
  },[msgs,loading,stageIdx]);

  // Stage timer while generating — advances Preparing → … → Finalizing.
  useEffect(()=>{
    if(!loading){ setStageIdx(0); setElapsed(0); return; }
    const t0 = Date.now();
    const iv = setInterval(()=>{
      const sec = Math.floor((Date.now()-t0)/1000);
      setElapsed(sec);
      setStageIdx(stageFor(sec));
    },1000);
    return ()=>clearInterval(iv);
  },[loading]);

  useEffect(()=>{
    fetch("/api/game/generate",{cache:"no-store"}).then(r=>r.json()).then(j=>{
      const custom = Array.isArray(j?.customModels) ? j.customModels : [];
      const oc = Array.isArray(j?.opencodeModels) ? j.opencodeModels : [];
      const kl = Array.isArray(j?.kiloModels) ? j.kiloModels : [];
      if (custom.length || oc.length || kl.length) setModels([...custom, ...oc, ...kl]);
      else if(Array.isArray(j?.freeModels)) setModels(j.freeModels);
      if(Array.isArray(j?.kiloModels)) setKiloModels(j.kiloModels);
      // Default to custom hl model when available
      if (custom.length) setModelSel(custom[0]);
    }).catch(()=>{});
    const sp=new URLSearchParams(location.search);
    const q=sp.get("prompt");
    const hid=sp.get("history");
    if(hid && !autoRan.current){
      autoRan.current=true;
      (async ()=>{
        try{
          const r = await fetch("/api/game/history?id="+encodeURIComponent(hid),{cache:"no-store"});
          const j = await r.json().catch(()=>({}));
          if(r.ok && j.entry){
            setHtml(j.entry.html||""); setProvider(j.entry.provider||""); setPlan(j.entry.plan||"");
            setContext(String(j.entry.prompt||"").slice(-700));
            setMsgs(m=>[...m,{role:"ai",text:"📂 History থেকে load হলো: "+String(j.entry.prompt||"").slice(0,120)}]);
          }
        }catch{}
      })();
    }
    else if(q && !autoRan.current){ autoRan.current=true; send(q); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  useEffect(()=>{
    if(!isFs) return;
    const onKey=(e:KeyboardEvent)=>{ if(e.key==="Escape") setIsFs(false)};
    addEventListener("keydown",onKey);
    return()=>removeEventListener("keydown",onKey);
  },[isFs]);

  const showToast=(m:string)=>{ setToast(m); setTimeout(()=>setToast(""),2200)};

  // --- Plan before build: AI writes a short plan, user confirms, then builds ---
  const makePlan = async ()=>{
    const text = input.trim() || context.trim();
    if(!text){ showToast("First describe your game"); return; }
    setPlanLoading(true);
    try{
      const r = await fetch("/api/game/plan",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:text.slice(-700), model: modelSel === "auto" ? "" : modelSel})});
      const j = await r.json().catch(()=>({}));
      if(!r.ok) throw new Error(j.error || ("Plan failed "+r.status));
      setPlan(j.plan || "");
      setMsgs(m=>[...m,{role:"ai",text:"📋 Plan ready — নিচে দেখো, ঠিক থাকলে Confirm & Build চাপো."}]);
    }catch(e:any){ setMsgs(m=>[...m,{role:"ai",text:String(e?.message||"Plan failed"),err:true}]); }
    setPlanLoading(false);
  };

  // --- History: server (login) + localStorage fallback ---
  const loadHistory = async ()=>{
    setHistLoading(true);
    try{
      const r = await fetch("/api/game/history",{cache:"no-store"});
      const j = await r.json().catch(()=>({}));
      if(r.ok && Array.isArray(j.history)){ setHistory(j.history); try{ localStorage.setItem("cb_game_hist", JSON.stringify(j.history.slice(0,20))); }catch{} }
      else throw new Error("server");
    }catch{
      try{ const local = JSON.parse(localStorage.getItem("cb_game_hist")||"[]"); if(Array.isArray(local)) setHistory(local); }catch{}
    }
    setHistLoading(false);
  };
  const saveHistory = async (entry:{prompt:string;plan:string;provider:string;model:string;html:string;summary:string})=>{
    const item: HistItem = { id:"local_"+Date.now(), prompt:entry.prompt, plan:entry.plan, provider:entry.provider, model:entry.model, htmlSize:entry.html.length, summary:entry.summary, createdAt:new Date().toISOString() };
    try{
      const local = [item, ...history].slice(0,20);
      setHistory(local);
      localStorage.setItem("cb_game_hist", JSON.stringify(local));
    }catch{}
    try{
      const r = await fetch("/api/game/history",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(entry)});
      if(r.ok) loadHistory();
    }catch{}
  };
  const loadEntry = async (id:string)=>{
    if(id.startsWith("local_")){ showToast("Preview-এ load করতে server history থেকে খুলো"); return; }
    try{
      const r = await fetch("/api/game/history?id="+encodeURIComponent(id),{cache:"no-store"});
      const j = await r.json().catch(()=>({}));
      if(!r.ok) throw new Error(j.error||"Load failed");
      const h = j.entry;
      setHtml(h.html||""); setProvider(h.provider||""); setPlan(h.plan||""); setContext(String(h.prompt||"").slice(-700));
      setMsgs(m=>[...m,{role:"ai",text:"📂 History থেকে load হলো: "+String(h.prompt||"").slice(0,120)}]);
      setShowHistory(false);
    }catch(e:any){ showToast(String(e?.message||"Load failed")); }
  };
  const delEntry = async (id:string)=>{
    if(id.startsWith("local_")){ const nl = history.filter(h=>h.id!==id); setHistory(nl); try{localStorage.setItem("cb_game_hist",JSON.stringify(nl));}catch{} return; }
    await fetch("/api/game/history?id="+encodeURIComponent(id),{method:"DELETE"}).catch(()=>{});
    loadHistory();
  };
  const clearHistory = async ()=>{
    const locals = history.filter(h=>h.id.startsWith("local_"));
    setHistory(locals); try{localStorage.setItem("cb_game_hist",JSON.stringify(locals));}catch{}
    await fetch("/api/game/history?all=1",{method:"DELETE"}).catch(()=>{});
    loadHistory();
  };

  const send = async (raw?: string)=>{
    const text = (raw ?? input).trim();
    if(!text || genBusy.current) return;
    if(text.length>800){ showToast("Message too long (max 800)"); return; }
    // Whole chat becomes the build spec — every message rebuilds the full
    // game from scratch (pure AI output, no templates). Trimmed to fit the
    // API's 800-char prompt cap.
    const ctx = ((context ? context + "\n" : "") + text).slice(-700);
    setContext(ctx);
    setMsgs(m=>[...m,{role:"user",text}]);
    setInput("");
    await gen(ctx);
  };

  const gen = async (ctx: string)=>{
    genBusy.current = true;
    setLoading(true);
    const t0 = Date.now();
    try{
      const r = await fetch("/api/game/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:ctx, style:"auto", model: modelSel === "auto" ? "" : modelSel})});
      if(r.status===401){ showToast("Login required"); setLoading(false); genBusy.current = false; location.href="/login?next="+encodeURIComponent("/game?prompt="+ctx.slice(-200)); return; }
      const j0 = await r.json().catch(()=>({}));
      if(!r.ok) throw new Error(j0.error || ("Generate failed "+r.status));
      // New async flow: server returns a job id immediately; poll for the result
      // so Cloudflare Tunnel's 100s request timeout (524) can't kill it.
      let j: any = j0;
      if (j0.job && j0.id) {
        let done = false;
        for (let i = 0; i < 110; i++) {
          await new Promise(r2 => setTimeout(r2, 3000));
          let pr: Response | null = null;
          try { pr = await fetch("/api/game/generate?job=" + encodeURIComponent(j0.id), {cache:"no-store"}); } catch { continue; }
          const pj = await pr.json().catch(()=>({}));
          if (pr.status === 503) throw new Error(pj.error || "Generate failed 503");
          if (!pr.ok && pr.status !== 404) throw new Error(pj.error || ("Generate failed "+pr.status));
          if (pj.status === "done") { j = pj; done = true; break; }
          if (pr.status === 404) throw new Error("Server restarted while generating — try again.");
        }
        if (!done && !j.html) throw new Error("Generation timed out — try again (server busy).");
      }
      if(!j.html) throw new Error("No html returned");
      setHtml(j.html);
      setShowCode(false);
      setProvider(j.provider || "ai");
      const secs = Math.round((Date.now()-t0)/1000);
      // AI-written completion reply from the server; fallback to local text if empty.
      const aiText = String(j.summary || "").trim();
      setMsgs(m=>[...m,{role:"ai",text: aiText || `✅ Game ready in ${secs}s — live preview updated (${j.provider||"ai"}). Keep chatting to refine it.`}]);
      // Save to history (server + local). Plan included when user made one.
      saveHistory({prompt:ctx, plan, provider:j.provider||"ai", model:modelSel, html:j.html, summary:aiText});
    }catch(e:any){
      const raw = e?.message || "Failed";
      const friendly = /failed to fetch|networkerror|load failed|abort/i.test(raw)
        ? "Server unreachable — page reload kore abar try koro. Server down thakle start korte hobe."
        : raw;
      setMsgs(m=>[...m,{role:"ai",text:friendly,err:true}]);
    }
    setLoading(false);
    genBusy.current = false;
  };

  const download = ()=>{
    if(!html){ showToast("Generate first"); return; }
    const blob=new Blob([html],{type:"text/html"});
    const a=document.createElement("a");
    const url=URL.createObjectURL(blob);
    a.href=url;
    a.download=(context.split("\n")[0]||"game").replace(/[^a-z0-9]+/gi,"-").slice(0,30)+".html";
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
    const url = location.origin+"/game?prompt="+encodeURIComponent((context || input).slice(-500));
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
              <span className="chip">Chat to build</span>
              <span className="chip">Real AI output</span>
            </div>
            <h1>Game Studio <span className="grad-text">— Chat & Play</span></h1>
            <p>Just chat in plain English. Every message builds a real playable game — keep chatting to refine it, the preview updates live. Press <span className="kbd">Ctrl</span> + <span className="kbd">Enter</span> to send.</p>
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
          <div className="panel-head"><span>✦ Chat</span><span style={{display:"flex",gap:6}}><button className="tool" onClick={()=>{ setShowHistory(v=>!v); if(!showHistory) loadHistory(); }}>{showHistory?"Hide History":"🕘 History"}</button><a className="tool" href="/game/history" style={{textDecoration:"none"}}>All →</a></span></div>
          <div className="panel-body" style={{display:"grid",gap:12}}>
            {showHistory && (
              <div className="msg msg-ai" style={{maxHeight:220,overflowY:"auto"}}>
                <div style={{fontWeight:800,marginBottom:8}}>🕘 History {histLoading?"(loading…)":""}</div>
                {history.length===0 && !histLoading && <div style={{opacity:.6}}>No history yet — build a game first.</div>}
                {history.map(h=>(
                  <div key={h.id} style={{border:"1px solid #ffffff14",borderRadius:10,padding:"8px 10px",marginBottom:6}}>
                    <div style={{fontSize:12,fontWeight:700}}>{String(h.prompt||"").slice(0,80)}</div>
                    <div style={{fontSize:11,opacity:.6}}>{new Date(h.createdAt).toLocaleString()} · {h.provider||h.model} · {Math.round((h.htmlSize||0)/1024)}KB</div>
                    <div style={{display:"flex",gap:6,marginTop:6}}>
                      {!h.id.startsWith("local_") && <button className="tool" onClick={()=>loadEntry(h.id)}>Load</button>}
                      <button className="tool" onClick={()=>delEntry(h.id)}>Delete</button>
                    </div>
                  </div>
                ))}
                {history.length>0 && <button className="tool" onClick={clearHistory}>Clear all</button>}
              </div>
            )}
            <div ref={threadRef} className="chat-thread">
              {msgs.length===0 && !loading && (
                <div className="hint" style={{marginTop:0}}>No messages yet — describe your game below. AI builds a real single-file HTML game, no templates involved.</div>
              )}
              {msgs.map((m,i)=>(
                <div key={i} className={"msg "+(m.role==="user" ? "msg-user" : "msg-ai"+(m.err?" err":""))}>{m.text}</div>
              ))}
              {loading && <div className="msg msg-ai">{STAGES[stageIdx].icon} {STAGES[stageIdx].en}… <span style={{opacity:.6}}>({STAGES[stageIdx].bn} · {elapsed}s)</span></div>}
            </div>

            <div>
              <div className="label"><span>MODEL — FREE</span><span style={{opacity:.6}}>{provider || "auto"}</span></div>
              <select className="field" value={modelSel} onChange={e=>setModelSel(e.target.value)} style={{padding:"11px 14px"}}>
                <option value="auto">✦ Auto — best available</option>
                {models.filter(m=>!m.startsWith("opencode/") && !m.startsWith("kilo/")).length>0 && (
                  <optgroup label="Custom (localhost:20128)">
                    {models.filter(m=>!m.startsWith("opencode/") && !m.startsWith("kilo/")).map(m=>(
                      <option key={m} value={m}>{m} ★</option>
                    ))}
                  </optgroup>
                )}
                {models.length>0 && (
                  <optgroup label="opencode free (login once)">
                    {models.filter(m=>m.startsWith("opencode/")).map(m=>(
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </optgroup>
                )}
                {models.filter(m=>m.startsWith("kilo/")).length>0 && (
                  <optgroup label="Kilo free (no key)">
                    {models.filter(m=>m.startsWith("kilo/")).map(m=>(
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </optgroup>
                )}
                {kiloModels.length>0 && models.filter(m=>m.startsWith("kilo/")).length===0 && (
                  <optgroup label="Kilo free (no key)">
                    {kiloModels.map(m=>(
                      <option key={m} value={m}>{m.replace(/^kilo\//,"")}</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            <div>
              <div className="label"><span>CHAT — DESCRIBE OR REFINE</span><span style={{opacity:.6}}>{input.length}/800</span></div>
              <textarea ref={taRef} className="field" rows={3} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{ if((e.ctrlKey||e.metaKey)&&e.key==="Enter") send(); }} placeholder="e.g. Neon snake with glow… then: add swipe controls, faster levels" maxLength={800} />
              <div className="idea-row">
                {IDEAS.map(s=>(
                  <button key={s} className="tool" onClick={()=>{ setInput(s); taRef.current?.focus(); }}>{s}</button>
                ))}
              </div>
            </div>

            <button className="btn-primary" onClick={()=>send()} disabled={loading}>
              {loading?"Crafting…":(html?"Send & Update →":"Send & Build →")}
            </button>
            <div style={{display:"flex",gap:8}}>
              <button className="tool" style={{flex:1}} onClick={makePlan} disabled={planLoading||loading}>{planLoading?"Planning…":"📋 Plan first"}</button>
              {plan && <button className="tool" onClick={()=>setPlan("")}>Clear plan</button>}
            </div>
            {plan && (
              <div className="msg msg-ai" style={{whiteSpace:"pre-wrap"}}>
                <div style={{fontWeight:800,marginBottom:6}}>📋 Build Plan</div>
                {plan}
                <div style={{display:"flex",gap:6,marginTop:8}}>
                  <button className="tool" onClick={()=>send()} disabled={loading}>✅ Confirm & Build</button>
                </div>
              </div>
            )}
            <div className="hint">Each message rebuilds the full game from the whole chat — preview updates live on the right. Tip: Plan first, then Confirm & Build.</div>
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
                  <div className="skeleton" style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
                    <div className="pulse"/>
                    <div style={{fontWeight:800,fontSize:17}}>{STAGES[stageIdx].icon} {STAGES[stageIdx].en}…</div>
                    <div style={{opacity:.6,fontSize:12}}>{STAGES[stageIdx].bn} · {elapsed}s · {provider || "ai working"}</div>
                    <div className="stage-bar"><div className="stage-fill" style={{width:Math.min(100,((stageIdx+1)/STAGES.length)*100)+"%"}}/></div>
                    <div className="stage-list">
                      {/* Show only the CURRENT stage, one at a time */}
                      <div key={stageIdx} className="stage-row active" style={{animation:"stagePop .5s cubic-bezier(.34,1.56,.64,1)"}}>
                        <span className="stage-ico" style={{animation:"icoBounce 1s ease-in-out infinite",display:"inline-block"}}>{STAGES[stageIdx].icon}</span>
                        <span>{STAGES[stageIdx].en}</span>
                        <span className="stage-dots"><span>.</span><span>.</span><span>.</span></span>
                      </div>
                      <div style={{opacity:.55,fontSize:11,fontWeight:600,marginTop:4,paddingLeft:4}}>
                        step {stageIdx + 1}/{STAGES.length} · done: {STAGES.slice(0,stageIdx).map(s=>s.en).join(" → ") || "none"}
                      </div>
                    </div>
                  </div>
                ) : html ? (
                  <div className="game-frame" style={{width:"100%",height:"100%"}}>
                  <iframe ref={frameRef} title="preview" srcDoc={html} style={{width:"100%",height:"100%",border:0,background:"#020617",display:"block"}} sandbox="allow-scripts allow-pointer-lock" allow="fullscreen" />
                  </div>
                ) : (
                  <div style={{textAlign:"center",padding:36,position:"relative"}}>
                    <div className="empty-art">🕹️</div>
                    <div style={{fontSize:22,fontWeight:800,margin:"10px 0 6px"}}>Ready to build</div>
                    <div style={{opacity:.6,fontSize:13,marginBottom:18}}>Chat on the left and hit Send</div>
                    <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
                      <button className="btn-primary" style={{width:"auto",padding:"10px 20px"}} onClick={()=>send("neon snake with glow")}>Try Snake</button>
                      <button className="tool" onClick={()=>send("flappy bird retro sky")}>Try Flappy</button>
                      <button className="tool" onClick={()=>send("racing neon drift")}>Try Racing</button>
                    </div>
                  </div>
                )}
              </div>
              </div>
            ) : (
              <pre>{html || "// Chat to generate a game"}</pre>
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
