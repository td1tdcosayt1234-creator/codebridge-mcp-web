import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { readDb } from "@/lib/db";
export async function GET(){
  const t=cookies().get("session")?.value||"";
  const p=await verifyJwt(t);
  if(!p) return NextResponse.json({user:null});
  const db=await readDb(); const u=db.users.find(x=>x.id===p.sub);
  if(!u) return NextResponse.json({user:null});
  return NextResponse.json({user:{id:u.id,email:u.email,role:u.role,plan:u.plan}});
}
