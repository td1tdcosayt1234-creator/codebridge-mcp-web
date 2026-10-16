"use client"; import { useEffect, useRef, useState } from "react";
import { useAdblock } from "../../../components/ads/useAdblock";
// Monetag SmartLink (sponsor) — opens on Watch, reward still verified server-side.
const SMARTLINK_URL = "https://uplcm.com/4/12029550";
export default function Earn(){
  const [info,setInfo]=useState<any>(null); const [nonce,setNonce]=useState(""); const [left,setLeft]=useState(0); const [msg,setMsg]=useState(""); const { adblock, recheck } = useAdblock();
  const finishing=useRef(false); const openedRef=useRef(false);
  async function load(){ const r=await fetch("/api/earn"); const j=await r.json(); if(r.ok) setInfo(j); }
  useEffect(()=>{ load(); },[]);
  useEffect(()=>{
    if(left<=0||!nonce) return;
    const t=setInterval(()=>setLeft((v)=>{
      if(v<=1){ clearInterval(t); finish(); return 0; }
      return v-1;
    }),1000);
    return ()=>clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[nonce]);
  async function start(){
    setMsg("");
    finishing.current=false;
    // Re-probe at click time: blockers enabled mid-session must not slip through.
    const blockedNow = recheck();
    // Strict: adblock on = no earn. First-party sponsor banner still visible
    // below, but coins require the 3rd-party ad stack to load.
    if(blockedNow){ setMsg("Adblock detected — turn it off for this site, then Watch. VPN/Proxy must also be off."); return; }
    openedRef.current = false;
    try { const w = window.open(SMARTLINK_URL, "_blank", "noopener,noreferrer"); if (w) openedRef.current = true; } catch {}
    if (!openedRef.current) { setMsg((m)=>m?m+" Sponsor auto-open hoy nai — niche sponsor banner e click kore Watch again chap daw.":"Popup blocked — allow popups for this site, or click the sponsor banner below, then Watch again."); }
    const r=await fetch("/api/earn",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"start",adblock:blockedNow})});
    const j=await r.json();
    if(!r.ok){ setMsg(j.error||"Failed"); return; }
    setNonce(j.nonce); setLeft(j.seconds);
  }
  async function finish(){
    if(finishing.current) return; finishing.current=true;
    try {
      const blockedNow = recheck();
      const r=await fetch("/api/earn",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"complete",nonce,opened:openedRef.current,adblock:blockedNow})});
      const j=await r.json().catch(()=>({}));
      setNonce("");
      if(!r.ok){ setMsg(j.error||"Failed"); load(); return; }
      setMsg("+" + j.reward + " coins earned! New balance: " + j.balance);
      load();
    } catch {
      setMsg("Network failed — press Watch to try again.");
      setNonce("");
      load();
    } finally {
      finishing.current=false;
    }
  }
  if(!info) return <p className="muted">Loading...</p>;
  return (<div>
    <h2>Earn Coins — watch ads</h2>
    <p className="muted small">Watch a {info.seconds}s ad, earn <b>+{info.reward} coins</b> (1 coin = 1 compile token). {info.remainingToday} left today. Balance: <b>{info.balance}</b></p>
    {/* First-party sponsor banner. Click = opened proof. */}
    <a href={SMARTLINK_URL} target="_blank" rel="noopener noreferrer" onClick={()=>{ openedRef.current = true; }}
       style={{display:"block",marginTop:12,borderRadius:12,overflow:"hidden",textDecoration:"none",
               background:"linear-gradient(135deg,#1e1b4b,#0e7490)",border:"1px solid #22d3ee55"}}>
      <div style={{padding:"18px 20px",display:"flex",gap:14,alignItems:"center"}}>
        <div style={{fontSize:34}}>🎁</div>
        <div>
          <div style={{color:"#fff",fontWeight:800,fontSize:16}}>Sponsor — tap to open</div>
          <div className="muted small" style={{color:"#e2e8f0"}}>New tab e sponsor khulbe. Watch chap dile timer start hobe, full {info.seconds}s sesh hole +{info.reward} coins.</div>
        </div>
        <div style={{marginLeft:"auto",background:"#fff",color:"#0e7490",fontWeight:800,borderRadius:8,padding:"8px 14px",whiteSpace:"nowrap"}}>Open →</div>
      </div>
    </a>
    <div className="grid g2" style={{marginTop:12}}>
      <div className="card" style={{textAlign:"center",minHeight:220,display:"flex",flexDirection:"column",justifyContent:"center"}}>
        {!nonce
          ? (<div><div style={{fontSize:40}}>📺</div><p className="muted small">Sponsored — real ads on this page pay for your coins</p>
              <button className="btn" disabled={info.remainingToday<=0} onClick={start}>{info.remainingToday<=0?"Daily limit reached":"Watch ad (+"+info.reward+")"}</button>
              <p className="muted small" style={{marginTop:8}}>Watch opens sponsor link in new tab — keep it open full {info.seconds}s. <a href={SMARTLINK_URL} target="_blank" rel="noopener noreferrer" onClick={()=>{ openedRef.current = true; }}>Open sponsor manually</a></p></div>)
          : (<div><div style={{fontSize:40}}>▶️</div><p><b>Ad playing... {left}s</b></p>
              <div style={{background:"#ffffff14",borderRadius:8,height:10}}><div style={{width:((info.seconds>0?(info.seconds-left)/info.seconds*100:0))+"%",height:10,borderRadius:8,background:"linear-gradient(90deg,#6c8cff,#22d3ee)"}}/></div>
              <p className="muted small">Do not close — reward is verified on the server.</p></div>)}
      </div>
      <div className="card"><h3>How it works</h3><ul className="small check"><li>Press Watch — server opens a verified session</li><li>Finish the full {info.seconds}s — skipping earns nothing</li><li>Max {info.dailyMax} ads/day = {info.dailyMax*info.reward} coins</li><li>Reward lands instantly in your balance</li></ul>{msg&&<p className="small">{msg}</p>}</div>
    </div>
  </div>);
}
