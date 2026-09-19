import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { verifyJwt } from "@/lib/auth";

// Server-side admin gate (replaces edge middleware): non-admin -> 404.
export default async function AdminLayout({children}:{children:React.ReactNode}){
  const t = cookies().get("session")?.value || "";
  const p = await verifyJwt(t);
  if (!p || p.role !== "admin") notFound();
  const items=[["/admin","Overview"],["/admin/runner","Runner (Actions)"],["/admin/github","GitHub Token"],["/admin/users","Users"],["/admin/tokens","Tokens"],["/admin/tracking","Tracking"],["/admin/mcp-control","MCP Control"],["/admin/content","Content"],["/admin/support","Support"],["/admin/logs","Logs"]];
  return (<div style={{padding:"20px 0"}}><h1>Admin Dashboard</h1><div className="sidebar" style={{marginTop:12}}><div className="side card">{items.map(([h,t])=>(<Link key={h} href={h}>{t}</Link>))}</div><div style={{flex:1,minWidth:0}}>{children}</div></div></div>);
}
