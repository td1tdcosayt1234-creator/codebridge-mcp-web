"use client"; import { useEffect, useState } from "react";
export default function Settings(){
  const [me,setMe]=useState<any>(null); useEffect(()=>{fetch("/api/auth/me").then(r=>r.json()).then(setMe);},[]);
  return (<div><h2>Settings</h2><div className="card"><div>Email: <b>{me?.user?.email||"..."}</b></div><div>Plan: <span className="badge ok">{me?.user?.plan||"free"}</span> Role: <span className="badge">{me?.user?.role||"user"}</span></div><p className="muted small">Change plan in /pricing. Delete data via /support ticket.</p></div></div>);
}
