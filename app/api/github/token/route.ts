import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { readDb, writeDb, uid } from "@/lib/db";
import { encToken } from "@/lib/crypto";
async function me(){ const t=cookies().get("session")?.value||""; return await verifyJwt(t); }
export async function POST(req:Request){
  const p=await me(); if(!p) return NextResponse.json({error:"auth"},{status:401});
  const {token}=await req.json();
  if(!token||!String(token).startsWith("ghp_")&&!String(token).startsWith("github_pat_")) return NextResponse.json({error:"Use a GitHub Classic Token starting with ghp_ or github_pat_"} ,{status:400});
  const db=await readDb();
  const enc=encToken(String(token));
  const ex=db.githubTokens.find(x=>x.userId===p.sub);
  if(ex) ex.enc=enc; else db.githubTokens.push({userId:p.sub,enc});
  const us=db.usage.find(x=>x.userId===p.sub); if(us) us.githubCalls+=1;
  db.events.push({id:uid("e"),userId:p.sub,action:"github_token_save",detail:"classic token saved",at:new Date().toISOString()});
  await writeDb(db);
  return NextResponse.json({ok:true});
}
export async function GET(){
  const p=await me(); if(!p) return NextResponse.json({error:"auth"},{status:401});
  const db=await readDb();
  const has=!!db.githubTokens.find(x=>x.userId===p.sub);
  let repos:string[]=[];
  if(has){
    try{
      const { Octokit } = await import("octokit");
      const { decToken } = await import("@/lib/crypto");
      const rec=db.githubTokens.find(x=>x.userId===p.sub)!;
      const oct=new Octokit({auth:decToken(rec.enc)});
      const r=await oct.request("GET /user/repos",{per_page:20,affiliation:"owner"});
      repos=(r.data as any[]).map(x=>x.full_name);
      const us=db.usage.find(x=>x.userId===p.sub); if(us) us.githubCalls+=1; await writeDb(db);
    }catch{ repos=[]; }
  }
  return NextResponse.json({connected:has,repos});
}
export async function DELETE(){
  const p=await me(); if(!p) return NextResponse.json({error:"auth"},{status:401});
  const db=await readDb(); db.githubTokens=db.githubTokens.filter(x=>x.userId!==p.sub);
  db.events.push({id:uid("e"),userId:p.sub,action:"github_token_remove",detail:"removed",at:new Date().toISOString()});
  await writeDb(db); return NextResponse.json({ok:true});
}
