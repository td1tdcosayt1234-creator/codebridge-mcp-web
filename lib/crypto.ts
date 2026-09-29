import crypto from "crypto";
const ALG="aes-256-gcm";
const DEV_KEY="dev-dev-dev-dev-dev-dev-dev-1234";
function key(){
  const s=process.env.TOKEN_ENC_KEY||DEV_KEY;
  // Fail closed: in production a missing/short key would make every stored
  // GitHub/AI/runner token decryptable with a public default. Refuse to boot.
  if (process.env.NODE_ENV==="production" && (s===DEV_KEY || s.trim().length<16))
    throw new Error("TOKEN_ENC_KEY missing or too short (min 16 chars) — refusing to boot in production.");
  return crypto.createHash("sha256").update(s).digest();
}
function keyFrom(secret:string){ return crypto.createHash("sha256").update(secret).digest(); }
export function encToken(plain:string){ const iv=crypto.randomBytes(12); const c=crypto.createCipheriv(ALG,key(),iv); const ct=Buffer.concat([c.update(plain,"utf8"),c.final()]); const tag=c.getAuthTag(); return Buffer.concat([iv,tag,ct]).toString("base64"); }
export function decToken(enc:string){ try{ const b=Buffer.from(enc,"base64"); const iv=b.subarray(0,12); const tag=b.subarray(12,28); const ct=b.subarray(28); const d=crypto.createDecipheriv(ALG,key(),iv); d.setAuthTag(tag); return Buffer.concat([d.update(ct),d.final()]).toString("utf8"); }catch{ return ""; } }
// Generic envelope keyed by an explicit secret (used for whole-DB encryption).
export function encWith(secret:string,plain:string){ const k=keyFrom(secret); const iv=crypto.randomBytes(12); const c=crypto.createCipheriv(ALG,k,iv); const ct=Buffer.concat([c.update(plain,"utf8"),c.final()]); const tag=c.getAuthTag(); return Buffer.concat([iv,tag,ct]).toString("base64"); }
export function decWith(secret:string,enc:string){ try{ const k=keyFrom(secret); const b=Buffer.from(enc,"base64"); const iv=b.subarray(0,12); const tag=b.subarray(12,28); const ct=b.subarray(28); const d=crypto.createDecipheriv(ALG,k,iv); d.setAuthTag(tag); return Buffer.concat([d.update(ct),d.final()]).toString("utf8"); }catch{ return ""; } }
export function mask(t:string){ if(!t||t.length<8) return "****"; return t.slice(0,4)+"****"+t.slice(-4); }
