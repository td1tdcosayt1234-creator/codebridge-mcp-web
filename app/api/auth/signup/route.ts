import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { readDb, writeDb, uid } from "@/lib/db";
import { signJwt } from "@/lib/auth";
export async function POST(req:Request){
  const {email,password}=await req.json();
  if(!email||!password) return NextResponse.json({error:"email+password required"},{status:400});
  const db=await readDb();
  if(db.users.find(u=>u.email.toLowerCase()===String(email).toLowerCase())) return NextResponse.json({error:"exists"},{status:409});
  const passHash=await bcrypt.hash(String(password),10);
  const u={id:uid("u"),email:String(email),passHash,role:"user" as const,plan:"free" as const,createdAt:new Date().toISOString()};
  db.users.push(u); db.mcpKeys.push({userId:u.id,key:"cb_"+Math.random().toString(36).slice(2,14)}); db.usage.push({userId:u.id,mcpCalls:0,githubCalls:0});
  db.events.push({id:uid("e"),userId:u.id,action:"signup",detail:u.email,at:new Date().toISOString()});
  await writeDb(db);
  const token=await signJwt({sub:u.id,email:u.email,role:u.role});
  const res=NextResponse.json({ok:true});
  res.cookies.set("session",token,{httpOnly:true,path:"/",maxAge:604800,sameSite:"lax"});
  return res;
}
