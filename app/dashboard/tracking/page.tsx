"use client"; import { useEffect, useState } from "react";
export default function Tracking(){
  const [d,setD]=useState<any>(null); useEffect(()=>{fetch("/api/overview").then(r=>r.json()).then(setD);},[]);
  return (<div><h2>Tracking</h2><div className="card"><table><thead><tr><th>Time</th><th>Action</th><th>Detail</th></tr></thead><tbody>{(d?.events||[]).map((e:any)=>(<tr key={e.id}><td className="small">{e.at}</td><td><span className="badge">{e.action}</span></td><td className="small">{e.detail}</td></tr>))}</tbody></table></div></div>);
}
