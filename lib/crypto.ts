import crypto from "crypto";
const ALG="aes-256-gcm";
function key(){ const s=process.env.TOKEN_ENC_KEY||"dev-dev-dev-dev-dev-dev-dev-1234"; return crypto.createHash("sha256").update(s).digest(); }
export function encToken(plain:string){ const iv=crypto.randomBytes(12); const c=crypto.createCipheriv(ALG,key(),iv); const ct=Buffer.concat([c.update(plain,"utf8"),c.final()]); const tag=c.getAuthTag(); return Buffer.concat([iv,tag,ct]).toString("base64"); }
export function decToken(enc:string){ try{ const b=Buffer.from(enc,"base64"); const iv=b.subarray(0,12); const tag=b.subarray(12,28); const ct=b.subarray(28); const d=crypto.createDecipheriv(ALG,key(),iv); d.setAuthTag(tag); return Buffer.concat([d.update(ct),d.final()]).toString("utf8"); }catch{ return ""; } }
export function mask(t:string){ if(!t||t.length<8) return "****"; return t.slice(0,4)+"****"+t.slice(-4); }
