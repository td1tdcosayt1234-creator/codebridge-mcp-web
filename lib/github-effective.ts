import type { DbShape } from "./db";
import { decToken } from "./crypto";
export function effectiveGithubToken(db:DbShape, userId:string):{token:string; source:"user"|"global"|null}{
  const own=db.githubTokens.find(x=>x.userId===userId);
  if(own){ const t=decToken(own.enc); if(t) return {token:t,source:"user"}; }
  if(db.globalGithub?.enc){ const g=decToken(db.globalGithub.enc); if(g) return {token:g,source:"global"}; }
  return {token:"",source:null};
}
