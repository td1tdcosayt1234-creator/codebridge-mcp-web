import * as jose from "jose";
const DEV_SECRET="dev-secret-change-me-please-32chars";
const secret=()=>{
  const s=process.env.AUTH_SECRET||DEV_SECRET;
  // Fail closed: a default AUTH_SECRET lets anyone forge admin sessions.
  if (process.env.NODE_ENV==="production" && (s===DEV_SECRET || s.trim().length<32))
    throw new Error("AUTH_SECRET missing or too short (min 32 chars) — refusing to boot in production.");
  return new TextEncoder().encode(s);
};
export async function signJwt(p:any, exp:string="24h"){ return await new jose.SignJWT(p).setProtectedHeader({alg:"HS256"}).setExpirationTime(exp).sign(secret()); }
export async function verifyJwt(t:string){ try{ const {payload}=await jose.jwtVerify(t,secret()); return payload as any; }catch{ return null; } }
export function getCookie(h:string|null,name:string){ if(!h) return ""; const m=h.split(";").map(s=>s.trim()).find(s=>s.startsWith(name+"=")); return m?decodeURIComponent(m.slice(name.length+1)):""; }
