"use client";
import Link from "next/link";
export default function DashLayout({children}:{children:React.ReactNode}){
  const items=[["/dashboard","Overview"],["/dashboard/tasks","Requests"],["/dashboard/builds","Builds"],["/dashboard/github","GitHub"],["/dashboard/mcp","Connect Agent"],["/dashboard/tokens","My Coins"],["/dashboard/tracking","Tracking"],["/dashboard/earn","Earn Coins"],["/dashboard/settings","Settings"]];
  return (<div style={{padding:"20px 0"}}><h1>Dashboard</h1><div className="sidebar" style={{marginTop:12}}><div className="side card">{items.map(([h,t])=>(<Link key={h} href={h}>{t}</Link>))}<button className="btn-ghost" style={{marginTop:8}} onClick={()=>{fetch("/api/auth/logout",{method:"POST"}).then(()=>location.href="/login");}}>Logout</button></div><div style={{flex:1,minWidth:0}}>{children}</div></div></div>);
}
