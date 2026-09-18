import Link from "next/link";
export default function AdminLayout({children}:{children:React.ReactNode}){
  const items=[["/admin","Overview"],["/admin/users","Users"],["/admin/tokens","Tokens"],["/admin/tracking","Tracking"],["/admin/mcp-control","MCP Control"],["/admin/content","Content"],["/admin/support","Support"],["/admin/logs","Logs"]];
  return (<div style={{padding:"20px 0"}}><h1>Admin Dashboard</h1><p className="muted small">admin@local.test / admin123 (change in prod)</p><div className="sidebar" style={{marginTop:12}}><div className="side card">{items.map(([h,t])=>(<Link key={h} href={h}>{t}</Link>))}</div><div style={{flex:1,minWidth:0}}>{children}</div></div></div>);
}
