import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { readDb } from "@/lib/db";
export async function GET(){
  const t=cookies().get("session")?.value||""; const p=await verifyJwt(t); if(!p) return NextResponse.json({error:"auth"},{status:401});
  const db=await readDb();
  const mine=db.events.filter(e=>e.userId===p.sub);
  const ev=mine.slice(-200).reverse();
  const stats:Record<string,number>={}; for(const e of mine) stats[e.action]=(stats[e.action]||0)+1;
  const byDay:Record<string,number>={}; for(const e of mine.slice(-500)){ const d=e.at.slice(0,10); byDay[d]=(byDay[d]||0)+1; }
  const us=db.usage.find(u=>u.userId===p.sub)||{userId:p.sub,mcpCalls:0,githubCalls:0,balance:0,usedTotal:0};
  const builds=db.builds.filter(b=>b.userId===p.sub).slice(-50).reverse();
  const tasks=db.tasks.filter(x=>x.userId===p.sub).sort((a,b)=>(a.createdAt<b.createdAt?1:-1)).slice(0,20);
  const key=db.mcpKeys.find(k=>k.userId===p.sub);
  return NextResponse.json({events:ev,stats,byDay,usage:us,builds,tasks,key:key?.key||""});
}
