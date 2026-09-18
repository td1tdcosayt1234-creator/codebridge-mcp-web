import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { readDb } from "@/lib/db";
export async function GET(){
  const t=cookies().get("session")?.value||""; const p=await verifyJwt(t);
  if(!p||p.role!=="admin") return NextResponse.json({error:"admin only"},{status:403});
  const db=await readDb();
  return NextResponse.json({users:db.users.map(u=>({id:u.id,email:u.email,role:u.role,plan:u.plan,createdAt:u.createdAt})),events:db.events.slice(-200).reverse(),builds:db.builds.slice(-100).reverse(),usage:db.usage,tickets:db.tickets.slice(-100).reverse(),globalGithub:{configured:!!db.globalGithub?.enc,updatedBy:db.globalGithub?.updatedBy||"",updatedAt:db.globalGithub?.updatedAt||""}});
}
