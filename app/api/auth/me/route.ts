import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt, validSession } from "@/lib/auth";
import { readDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(){
  const t=cookies().get("session")?.value||"";
  const p=validSession(await verifyJwt(t));
  if(!p) return NextResponse.json({user:null});
  const db=await readDb(); const u=db.users.find(x=>x.id===p.sub);
  if(!u) return NextResponse.json({user:null});
  return NextResponse.json({user:{id:u.id,email:u.email,role:u.role,plan:u.plan,firstName:u.firstName||"",lastName:u.lastName||"",country:u.country||"",gender:u.gender||"",hearAbout:u.hearAbout||"",goal:u.goal||"",surveyDone:!!(u.gender&&u.hearAbout&&u.goal)}});
}
