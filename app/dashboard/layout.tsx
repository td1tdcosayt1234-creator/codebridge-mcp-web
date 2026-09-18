"use client";
import Link from "next/link";
export default function DashLayout({children}:{children:React.ReactNode}){
  const items=[["/dashboard","Overview"],["/dashboard/github","GitHub"],["/dashboard/mcp","MCP Key"],["/dashboard/builds","Builds"],["/dashboard/tokens","Token Uses"],["/dashboard/tracking","Tracking"],["/dashboard/settings","Settings"]];
  return (<div style={{padding:"20px 0"}}><h1>User Dashboard</h1><div className="sidebar" style={{marginTop:12}}><div className="side card">{items.map(([h,t])=>(<Link key={h} href={h}>{t}</Link>))}<button className="btn-ghost" style={{marginTop:8}} onClick={()=>{fetch("/api/auth/logout",{method:"POST"}).then(()=>location.href="/login");}}>Logout</button></div><div style={{flex:1,minWidth:0}}>{children}</div></div></div>);
}
