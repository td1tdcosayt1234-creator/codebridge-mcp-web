import * as jose from "jose";
const secret=()=>new TextEncoder().encode(process.env.AUTH_SECRET||"dev-secret-change-me-please-32chars");
export async function signJwt(p:any, exp:string="24h"){ return await new jose.SignJWT(p).setProtectedHeader({alg:"HS256"}).setExpirationTime(exp).sign(secret()); }
export async function verifyJwt(t:string){ try{ const {payload}=await jose.jwtVerify(t,secret()); return payload as any; }catch{ return null; } }
export function getCookie(h:string|null,name:string){ if(!h) return ""; const m=h.split(";").map(s=>s.trim()).find(s=>s.startsWith(name+"=")); return m?decodeURIComponent(m.slice(name.length+1)):""; }
