import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { readDb, writeDb, uid } from "@/lib/db";
export async function GET(){
  const t=cookies().get("session")?.value||""; const p=await verifyJwt(t); if(!p) return NextResponse.json({error:"auth"},{status:401});
  const db=await readDb();
  const ev=db.events.filter(e=>e.userId===p.sub).slice(-100).reverse();
  const us=db.usage.find(u=>u.userId===p.sub)||{mcpCalls:0,githubCalls:0};
  const builds=db.builds.filter(b=>b.userId===p.sub).slice(-50).reverse();
  const tasks=db.tasks.filter(x=>x.userId===p.sub).sort((a,b)=>(a.createdAt<b.createdAt?1:-1)).slice(0,20);
  const key=db.mcpKeys.find(k=>k.userId===p.sub);
  return NextResponse.json({events:ev,usage:us,builds,tasks,key:key?.key||""});
}
export async function POST(req:Request){
  const t=cookies().get("session")?.value||""; const p=await verifyJwt(t); if(!p) return NextResponse.json({error:"auth"},{status:401});
  const {repo,branch}=await req.json();
  const db=await readDb();
  const { decToken } = await import("@/lib/crypto");
  const globalToken=db.globalGithub?.enc?decToken(db.globalGithub.enc):"";
  if(!globalToken) return NextResponse.json({error:"Admin ekhono global GitHub token set korenai. Admin ke /admin/github theke add korte bolo."},{status:400});
  const b={id:uid("run"),userId:p.sub,repo:String(repo||"demo/repo"),branch:String(branch||"main"),status:"queued",log:`Triggered via dashboard using admin global GitHub token. Push -> checkout -> build -> artifact.`,at:new Date().toISOString()};
  db.builds.push(b);
  const us=db.usage.find(u=>u.userId===p.sub); if(us){us.mcpCalls+=1;us.githubCalls+=1;}
  db.events.push({id:uid("e"),userId:p.sub,action:"build_trigger",detail:b.repo+"#"+b.branch,at:new Date().toISOString()});
  await writeDb(db);
  setTimeout(()=>{},0);
  return NextResponse.json({ok:true,build:b});
}
