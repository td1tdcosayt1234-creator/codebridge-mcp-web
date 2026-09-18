import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { readDb, writeDb, uid } from "@/lib/db";
import { encToken } from "@/lib/crypto";
async function admin(){
  const t=cookies().get("session")?.value||"";
  const p=await verifyJwt(t);
  if(!p||p.role!=="admin") return null;
  return p;
}
// Admin sets the GLOBAL GitHub Classic token used by the whole tool.
export async function GET(){
  const p=await admin(); if(!p) return NextResponse.json({error:"admin only"},{status:403});
  const db=await readDb();
  return NextResponse.json({configured:!!db.globalGithub?.enc, updatedBy:db.globalGithub?.updatedBy||"", updatedAt:db.globalGithub?.updatedAt||""});
}
export async function POST(req:Request){
  const p=await admin(); if(!p) return NextResponse.json({error:"admin only"},{status:403});
  const { sameOrigin, csrfBlock }=await import("@/lib/security");
  if(!sameOrigin(req)) return csrfBlock();
  const {token}=await req.json();
  const s=String(token||"");
  if(!s.startsWith("ghp_")&&!s.startsWith("github_pat_")) return NextResponse.json({error:"Use a GitHub Classic Token starting with ghp_ or github_pat_ (needs repo + workflow scopes)"},{status:400});
  // live-verify before saving so the tool won't break
  try{
    const { Octokit }=await import("octokit");
    const oct=new Octokit({auth:s});
    await oct.request("GET /user");
  }catch{ return NextResponse.json({error:"Token invalid or GitHub unreachable. Check token + scopes."},{status:400}); }
  const db=await readDb();
  db.globalGithub={enc:encToken(s),updatedBy:p.email||p.sub,updatedAt:new Date().toISOString()};
  db.events.push({id:uid("e"),userId:p.sub,action:"admin_github_token_save",detail:"global classic token updated by "+(p.email||p.sub),at:new Date().toISOString()});
  await writeDb(db);
  return NextResponse.json({ok:true});
}
export async function DELETE(req:Request){
  const p=await admin(); if(!p) return NextResponse.json({error:"admin only"},{status:403});
  const { sameOrigin, csrfBlock }=await import("@/lib/security");
  if(!sameOrigin(req)) return csrfBlock();
  const db=await readDb();
  db.globalGithub=undefined;
  db.events.push({id:uid("e"),userId:p.sub,action:"admin_github_token_remove",detail:"global token removed",at:new Date().toISOString()});
  await writeDb(db);
  return NextResponse.json({ok:true});
}
