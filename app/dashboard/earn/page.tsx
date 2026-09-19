"use client"; import { useEffect, useRef, useState } from "react";
export default function Earn(){
  const [info,setInfo]=useState<any>(null); const [nonce,setNonce]=useState(""); const [left,setLeft]=useState(0); const [msg,setMsg]=useState(""); const [adblock,setAdblock]=useState(false);
  const finishing=useRef(false);
  async function load(){ const r=await fetch("/api/earn"); const j=await r.json(); if(r.ok) setInfo(j); }
  useEffect(()=>{ load(); },[]);
  useEffect(()=>{
    // anti-adblock: bait element check
    const d=document.createElement("div");
    d.className="adsbox ad-banner sponsored"; d.style.cssText="height:1px;width:1px;position:absolute;left:-9999px;";
    document.body.appendChild(d);
    setAdblock(d.offsetHeight===0);
    d.remove();
  },[]);
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
    if(adblock){ setMsg("Ad blocker detected. Disable it to earn coins."); return; }
    const r=await fetch("/api/earn",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"start"})});
    const j=await r.json();
    if(!r.ok){ setMsg(j.error||"Failed"); return; }
    setNonce(j.nonce); setLeft(j.seconds);
  }
  async function finish(){
    if(finishing.current) return; finishing.current=true;
    const r=await fetch("/api/earn",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"complete",nonce})});
    const j=await r.json();
    setNonce("");
    if(!r.ok){ setMsg(j.error||"Failed"); load(); return; }
    setMsg("+" + j.reward + " coins earned! New balance: " + j.balance);
    load();
  }
  if(!info) return <p className="muted">Loading...</p>;
  return (<div>
    <h2>Earn Coins — watch ads</h2>
    <p className="muted small">Watch a {info.seconds}s ad, earn <b>+{info.reward} coins</b> (1 coin = 1 compile token). {info.remainingToday} left today. Balance: <b>{info.balance}</b></p>
    {adblock&&<div className="card" style={{borderColor:"#ef444466"}}><b>Ad blocker detected.</b><p className="muted small" style={{marginBottom:0}}>Turn it off for this site to earn coins. VPN/Proxy must also be off.</p></div>}
    <div className="grid g2" style={{marginTop:12}}>
      <div className="card" style={{textAlign:"center",minHeight:220,display:"flex",flexDirection:"column",justifyContent:"center"}}>
        {!nonce
          ? (<div><div style={{fontSize:40}}>📺</div><p className="muted small">Sponsored slot (demo ad unit — replace with your ad network)</p>
              <button className="btn" disabled={info.remainingToday<=0||adblock} onClick={start}>{info.remainingToday<=0?"Daily limit reached":"Watch ad (+50)"}</button></div>)
          : (<div><div style={{fontSize:40}}>▶️</div><p><b>Ad playing... {left}s</b></p>
              <div style={{background:"#ffffff14",borderRadius:8,height:10}}><div style={{width:((info.seconds-left)/info.seconds*100)+"%",height:10,borderRadius:8,background:"linear-gradient(90deg,#6c8cff,#22d3ee)"}}/></div>
              <p className="muted small">Do not close — reward is verified on the server.</p></div>)}
      </div>
      <div className="card"><h3>How it works</h3><ul className="small check"><li>Press Watch — server opens a verified session</li><li>Finish the full {info.seconds}s — skipping earns nothing</li><li>Ad blocker and VPN must be off</li><li>Max {info.dailyMax} ads/day = {info.dailyMax*info.reward} coins</li><li>Reward lands instantly in your balance</li></ul>{msg&&<p className="small">{msg}</p>}</div>
    </div>
  </div>);
}
