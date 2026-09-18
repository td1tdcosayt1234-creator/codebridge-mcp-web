import { promises as fs } from "fs";
import path from "path";
export type User = { id:string; email:string; passHash:string; role:"user"|"admin"; plan:"free"|"pro"; createdAt:string };
export type EventItem = { id:string; userId:string; action:string; detail:string; ip?:string; at:string };
export type Build = { id:string; userId:string; repo:string; branch:string; status:string; log:string; at:string };
export type Ticket = { id:string; userId:string; subject:string; body:string; status:string; at:string };
export type DbShape = { users:User[]; events:EventItem[]; builds:Build[]; tickets:Ticket[]; githubTokens:{userId:string; enc:string}[]; mcpKeys:{userId:string; key:string}[]; usage:{userId:string; mcpCalls:number; githubCalls:number}[] };
const file = path.join(process.cwd(),"data","db.json");
const seedAdminEmail = "admin@local.test";
async function ensure(){
  try{ await fs.access(file); }catch{
    await fs.mkdir(path.dirname(file),{recursive:true});
    const bcrypt = (await import("bcryptjs")).default;
    const hash = await bcrypt.hash("admin123",10);
    const seed:DbShape={users:[{id:"u_admin",email:seedAdminEmail,passHash:hash,role:"admin",plan:"pro",createdAt:new Date().toISOString()}],events:[],builds:[],tickets:[],githubTokens:[],mcpKeys:[{userId:"u_admin",key:"cb_admin_demo_key"}],usage:[{userId:"u_admin",mcpCalls:0,githubCalls:0}]};
    await fs.writeFile(file,JSON.stringify(seed,null,2));
  }
}
export async function readDb():Promise<DbShape>{ await ensure(); const raw=await fs.readFile(file,"utf8"); return JSON.parse(raw); }
export async function writeDb(db:DbShape){ await fs.mkdir(path.dirname(file),{recursive:true}); await fs.writeFile(file,JSON.stringify(db,null,2)); }
export function uid(p:string){ return p+"_"+Math.random().toString(36).slice(2,9); }
