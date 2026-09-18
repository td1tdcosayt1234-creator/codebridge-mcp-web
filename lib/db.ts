import { promises as fs } from "fs";
import path from "path";
export type User = { id:string; email:string; passHash:string; role:"user"|"admin"; plan:"free"|"pro"; createdAt:string };
export type EventItem = { id:string; userId:string; action:string; detail:string; ip?:string; at:string };
export type Build = { id:string; userId:string; repo:string; branch:string; status:string; log:string; at:string };
export type Ticket = { id:string; userId:string; subject:string; body:string; status:string; at:string };
export type Usage = { userId:string; mcpCalls:number; githubCalls:number; balance:number; usedTotal:number };
export type Task = { id:string; userId:string; title:string; prompt:string; kind:"compile"|"fix-compile"; files:{path:string; content:string}[]; status:"queued"|"running"|"done"|"failed"; log:string; result:string; runUrl:string; tokensEst:number; tokensCharged:number; createdAt:string; updatedAt:string };
export type RunnerSettings = { builderRepo:string; builderWorkflow:string; runnerTokenEnc:string; updatedBy:string; updatedAt:string };
export type DbShape = { users:User[]; events:EventItem[]; builds:Build[]; tickets:Ticket[]; githubTokens:{userId:string; enc:string}[]; mcpKeys:{userId:string; key:string}[]; usage:Usage[]; globalGithub?:{enc:string; updatedBy:string; updatedAt:string}; tasks:Task[]; settings?:RunnerSettings };
const file = path.join(process.cwd(),"data","db.json");
const seedAdminEmail = "admin@local.test";
async function ensure(){
  try{ await fs.access(file); }catch{
    await fs.mkdir(path.dirname(file),{recursive:true});
    const bcrypt = (await import("bcryptjs")).default;
    const hash = await bcrypt.hash("admin123",10);
    const seed:DbShape={users:[{id:"u_admin",email:seedAdminEmail,passHash:hash,role:"admin",plan:"pro",createdAt:new Date().toISOString()}],events:[],builds:[],tickets:[],githubTokens:[],mcpKeys:[{userId:"u_admin",key:"cb_admin_demo_key"}],usage:[{userId:"u_admin",mcpCalls:0,githubCalls:0,balance:10000,usedTotal:0}],tasks:[]};
    await fs.writeFile(file,JSON.stringify(seed,null,2));
  }
}
export async function readDb():Promise<DbShape>{ await ensure(); const raw=await fs.readFile(file,"utf8"); const parsed=JSON.parse(raw); if(!parsed.tasks) parsed.tasks=[]; let dirty=false;
  for(const u of (parsed.usage||[])){ if(u.balance===undefined){ u.balance=10000; dirty=true; } if(u.usedTotal===undefined){ u.usedTotal=0; dirty=true; } }
  for(const t of (parsed.tasks||[])){ if(!t.kind) t.kind="compile"; if(!t.files) t.files=[]; if(t.tokensEst===undefined) t.tokensEst=0; if(t.tokensCharged===undefined) t.tokensCharged=0; }
  if(dirty){ try{ await fs.writeFile(file,JSON.stringify(parsed,null,2)); }catch{} }
  return parsed; }
export async function writeDb(db:DbShape){ await fs.mkdir(path.dirname(file),{recursive:true}); await fs.writeFile(file,JSON.stringify(db,null,2)); }
export function uid(p:string){ return p+"_"+Math.random().toString(36).slice(2,9); }
