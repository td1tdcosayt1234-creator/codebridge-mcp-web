import { promises as fs } from "fs";
import path from "path";
import { encWith, decWith } from "./crypto";
export type User = { id:string; email:string; passHash:string; role:"user"|"admin"; plan:"free"|"pro"; createdAt:string };
export type EventItem = { id:string; userId:string; action:string; detail:string; ip?:string; at:string };
export type Build = { id:string; userId:string; repo:string; branch:string; status:string; log:string; at:string };
export type Ticket = { id:string; userId:string; subject:string; body:string; status:string; at:string };
export type Usage = { userId:string; mcpCalls:number; githubCalls:number; balance:number; usedTotal:number };
export type Task = { id:string; userId:string; title:string; prompt:string; kind:"compile"|"fix-compile"; files:{path:string; content:string}[]; status:"queued"|"running"|"done"|"failed"; log:string; result:string; runUrl:string; tokensEst:number; tokensCharged:number; createdAt:string; updatedAt:string };
export type RunnerSettings = { builderRepo:string; builderWorkflow:string; runnerTokenEnc:string; updatedBy:string; updatedAt:string; lastGuestRefill?:string };
export type LoginAttempt = { email:string; fails:number; until:string };
export type EarnNonce = { nonce:string; userId:string; at:number; used:boolean };
export type ApprovalState = "waiting" | "approved" | "denied";
export type PendingCall = { id:string; tool:string; args:Record<string,unknown>; userId?:string; state:ApprovalState; createdAt:number; fp:{ip:string; ua:string} };
export type TrustedAgent = { id:string; userId:string; ip:string; ua:string; tool:string; createdAt:string; lastUsed:string; expiresAt:string };
export type OAuthClient = { id:string; redirectUris:string[]; createdAt:string };
export type OAuthCode = { code:string; userId:string; clientId:string; redirectUri:string; challenge:string; method:string; expires:number };
export type DbShape = { users:User[]; events:EventItem[]; builds:Build[]; tickets:Ticket[]; githubTokens:{userId:string; enc:string}[]; mcpKeys:{userId:string; key:string}[]; usage:Usage[]; globalGithub?:{enc:string; updatedBy:string; updatedAt:string}; tasks:Task[]; settings?:RunnerSettings; attempts:LoginAttempt[]; earnNonces:EarnNonce[]; approvals:PendingCall[]; trusted:TrustedAgent[]; oauthClients:OAuthClient[]; oauthCodes:OAuthCode[] };
const file = process.env.DB_FILE || (process.env.VERCEL ? "/tmp/codebridge-db.json" : path.join(process.cwd(), "data", "db.json"));

// ---- At-rest encryption (AES-256-GCM via lib/crypto) ----
// If DB_MASTER_KEY is set, the whole database file is stored encrypted:
// {"v":1,"data":"base64(iv|tag|ciphertext)"}. Without the key the file is
// opaque — password hashes, tokens and logs cannot be read from disk.
// Files without the wrapper are treated as legacy plaintext and get
// encrypted on the next write (automatic migration).
function dbKeySet(): boolean { return (process.env.DB_MASTER_KEY || "").trim().length >= 16; }
function dbSecret(): string { return (process.env.DB_MASTER_KEY || "").trim(); }
let noKeyWarned = false;
function warnNoDbKey() {
  if (noKeyWarned) return; noKeyWarned = true;
  console.warn("[codebridge] SECURITY: DB_MASTER_KEY not set — database is stored in PLAINTEXT. Set it to enable at-rest encryption.");
}
function encryptDb(plain: string): string {
  if (!dbKeySet()) { warnNoDbKey(); return plain; }
  return JSON.stringify({ v: 1, data: encWith(dbSecret(), plain) });
}
function decryptDb(raw: string): string {
  const t = raw.trim();
  if (t.startsWith('{"v":1') || t.startsWith('{"v": 1')) {
    let data = "";
    try { data = (JSON.parse(t) as { data?: string }).data || ""; } catch { throw new Error("Database envelope is corrupt."); }
    const plain = decWith(dbSecret(), data);
    if (!plain) throw new Error("Database decrypt failed — wrong DB_MASTER_KEY or corrupt file. NOT overwriting. Restore from data/db.json.bak.1 or fix the key.");
    return plain;
  }
  warnNoDbKey();
  return raw; // legacy plaintext
}
function seedAdminEmail(){ return (process.env.ADMIN_EMAIL || "admin@local.test").trim().toLowerCase().slice(0,120) || "admin@local.test"; }
async function seedAdminPassword(): Promise<{ password: string; generated: boolean }> {
  const pw = (process.env.ADMIN_PASSWORD || "").trim();
  if (pw.length >= 12) return { password: pw, generated: false };
  const { randomBytes } = await import("crypto");
  return { password: "Adm-" + randomBytes(12).toString("hex"), generated: true };
}
async function ensure(){
  try{ await fs.access(file); }catch{
    await fs.mkdir(path.dirname(file),{recursive:true});
    const bcrypt = (await import("bcryptjs")).default;
    const { password, generated } = await seedAdminPassword();
    const hash = await bcrypt.hash(password,10);
    const seed:DbShape={users:[{id:"u_admin",email:seedAdminEmail(),passHash:hash,role:"admin",plan:"pro",createdAt:new Date().toISOString()}],events:[],builds:[],tickets:[],githubTokens:[],mcpKeys:[{userId:"u_admin",key:"cb_admin_demo_key"}],usage:[{userId:"u_admin",mcpCalls:0,githubCalls:0,balance:10000,usedTotal:0}],tasks:[],attempts:[],earnNonces:[],approvals:[],trusted:[],oauthClients:[],oauthCodes:[]};
    await writeDb(seed);
    if (generated) console.warn("[codebridge] generated admin password (shown once — save it and set ADMIN_PASSWORD): " + password);
  }
}
// Loud once-per-boot warning if the well-known default password is still active.
let defaultPwWarned = false;
export async function warnIfDefaultAdminPassword(){
  if (defaultPwWarned) return; defaultPwWarned = true;
  try {
    const db = await readDb();
    const admin = db.users.find((u) => u.role === "admin");
    if (!admin) return;
    const bcrypt = (await import("bcryptjs")).default;
    if (await bcrypt.compare("admin123", admin.passHash))
      console.warn("[codebridge] SECURITY: default admin password (admin123) is still active on " + admin.email + " — change it immediately.");
  } catch { /* best effort */ }
}
export async function readDb():Promise<DbShape>{ await ensure(); const raw=await fs.readFile(file,"utf8"); const parsed=JSON.parse(decryptDb(raw)); if(!parsed.tasks) parsed.tasks=[]; let dirty=false;
  for(const u of (parsed.usage||[])){ if(u.balance===undefined){ u.balance=10000; dirty=true; } if(u.usedTotal===undefined){ u.usedTotal=0; dirty=true; } }
  for(const t of (parsed.tasks||[])){ if(!t.kind) t.kind="compile"; if(!t.files) t.files=[]; if(t.tokensEst===undefined) t.tokensEst=0; if(t.tokensCharged===undefined) t.tokensCharged=0; }
  if(!parsed.attempts) parsed.attempts=[];
  if(!parsed.oauthClients) parsed.oauthClients=[];
  if(!parsed.oauthCodes) parsed.oauthCodes=[];
  if(!parsed.earnNonces) parsed.earnNonces=[];
  if(!parsed.approvals) parsed.approvals=[];
  if(!parsed.trusted) parsed.trusted=[];
  // prune used/old earn nonces (>1h)
  const cutoff=Date.now()-3600000;
  const kept=(parsed.earnNonces as EarnNonce[]).filter(n=>!n.used&&n.at>cutoff);
  if(kept.length!==(parsed.earnNonces as EarnNonce[]).length){ parsed.earnNonces=kept; dirty=true; }
  if(dirty){ try{ await writeDb(parsed); }catch{} }
  void warnIfDefaultAdminPassword();
  return parsed; }
export async function writeDb(db:DbShape){
  const dir = path.dirname(file);
  await fs.mkdir(dir,{recursive:true});
  // Rotating backups (latest 3) so a bad write/key never means total loss.
  try {
    await fs.access(file);
    for (let i = 3; i >= 2; i--) { try { await fs.rename(file + ".bak." + (i - 1), file + ".bak." + i); } catch {} }
    try { await fs.copyFile(file, file + ".bak.1"); } catch {}
  } catch { /* first write — nothing to back up */ }
  // Atomic write: temp file + rename, never a half-written db.
  const tmp = file + ".tmp." + process.pid;
  await fs.writeFile(tmp, encryptDb(JSON.stringify(db)));
  await fs.rename(tmp, file);
}
export function uid(p:string){ return p+"_"+Math.random().toString(36).slice(2,9); }
