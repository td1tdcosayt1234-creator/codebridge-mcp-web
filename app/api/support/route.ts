import { NextResponse } from "next/server";
import { readDb, writeDb, uid } from "@/lib/db";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
export async function POST(req:Request){
  const {subject,body}=await req.json();
  const t=cookies().get("session")?.value||""; const p=await verifyJwt(t);
  const db=await readDb();
  db.tickets.push({id:uid("t"),userId:p?.sub||"anon",subject:String(subject||"support"),body:String(body||""),status:"open",at:new Date().toISOString()});
  await writeDb(db); return NextResponse.json({ok:true});
}
