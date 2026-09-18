import { NextResponse } from "next/server";
export async function GET(){ return NextResponse.json({mcp:{name:"codebridge",url:"https://your-domain.com/mcp",tools:["push_code","trigger_build","get_build_status","get_build_logs","list_repos"]}}); }
export async function POST(req:Request){
  const body=await req.json().catch(()=>({}));
  const tool=body.tool||body.method||"list_tools";
  if(tool==="list_tools") return NextResponse.json({tools:["push_code","trigger_build","get_build_status","get_build_logs","list_repos"]});
  return NextResponse.json({ok:true,tool,note:"Connect this endpoint as Remote MCP in opencode.json. Auth via Bearer MCP key from /dashboard/mcp."});
}
