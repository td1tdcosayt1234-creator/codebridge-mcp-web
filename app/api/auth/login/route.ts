import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { readDb, writeDb, uid } from "@/lib/db";
import { signJwt } from "@/lib/auth";
export async function POST(req:Request){
  const {email,password}=await req.json();
  const db=await readDb();
  const u=db.users.find(x=>x.email.toLowerCase()===String(email||"").toLowerCase());
  if(!u) return NextResponse.json({error:"invalid"},{status:401});
  const ok=await bcrypt.compare(String(password),u.passHash);
  if(!ok) { db.events.push({id:uid("e"),userId:u.id,action:"login_fail",detail:u.email,at:new Date().toISOString()}); await writeDb(db); return NextResponse.json({error:"invalid"},{status:401}); }
  db.events.push({id:uid("e"),userId:u.id,action:"login",detail:u.email,at:new Date().toISOString()}); await writeDb(db);
  const token=await signJwt({sub:u.id,email:u.email,role:u.role});
  const res=NextResponse.json({ok:true,role:u.role});
  res.cookies.set("session",token,{httpOnly:true,path:"/",maxAge:604800,sameSite:"lax"});
  return res;
}
