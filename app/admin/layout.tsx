import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { verifyJwt } from "@/lib/auth";
import SideNav from "../../components/SideNav";

// Server-side admin gate (replaces edge middleware): non-admin -> 404.
export default async function AdminLayout({children}:{children:React.ReactNode}){
  const t = cookies().get("session")?.value || "";
  const p = await verifyJwt(t);
  if (!p || p.role !== "admin") notFound();
  const items: [string, string, string][] = [
    ["/admin","Overview","📊"],["/admin/runner","Runner (Actions)","🚀"],["/admin/github","GitHub Token","🔑"],
    ["/admin/users","Users","👥"],["/admin/tokens","Tokens","🪙"],["/admin/tracking","Tracking","📍"],
    ["/admin/mcp-control","MCP Control","🎛️"],["/admin/content","Content","📝"],["/admin/support","Support","🎫"],["/admin/logs","Logs","📜"],
  ];
  return (
    <div style={{padding:"20px 0"}}>
      <div className="kicker"><span className="pulse-dot" />Admin only</div>
      <h1 style={{margin:"0 0 4px",letterSpacing:"-.5px"}}>Admin <span className="grad-anim">Dashboard</span></h1>
      <p className="muted small" style={{marginTop:0}}>Backend, users, coins, runner — full control.</p>
      <div className="sidebar" style={{marginTop:12}}>
        <SideNav items={items} />
        <div style={{flex:1,minWidth:0}}>{children}</div>
      </div>
    </div>
  );
}
