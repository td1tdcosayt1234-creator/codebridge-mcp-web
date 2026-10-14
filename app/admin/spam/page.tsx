"use client"; import { useEffect, useState } from "react";
type Row = { userId: string; email: string; plan: string; createdAt: string; score: number; signals: string[]; fps: string[]; earnsToday: number; fails24h: number; vpn24h: number };
export default function SpamRadar(){
  const [d,setD]=useState<{rows:Row[];clusters:{fp:string;userIds:string[];emails:string[]}[];counts?:{users:number;events:number}}|null>(null);
  useEffect(()=>{fetch("/api/admin/spam").then(r=>r.json()).then(setD);},[]);
  if(!d) return <p>Loading…</p>;
  if((d as {error?:string}).error) return <p>Admin only</p>;
  const risk = (s:number)=>s>=8?<span className="badge bad">HIGH {s}</span>:s>=4?<span className="badge warn">MED {s}</span>:<span className="badge ok">LOW {s}</span>;
  return (<div>
    <h2>Spam Radar</h2>
    <p className="muted small">Fingerprints (device+network hash, no raw IP stored) link sockpuppets. Score: +3/extra account, +4/fast farming, +3/failed-logins burst, +2/VPN block, +2/new-earner. Detection only — bans still come from the suspend ladder. {d.counts&&<span>{d.counts.users} users · {d.counts.events} events scanned.</span>}</p>
    <div className="card"><h3>Device clusters ({d.clusters.length})</h3>
      {d.clusters.length===0?<p className="muted small">No shared-device clusters — clean.</p>:
      <div className="table-wrap" style={{border:0}}><table><thead><tr><th>Fingerprint</th><th>Accounts</th></tr></thead><tbody>
        {d.clusters.map(c=>(<tr key={c.fp}><td className="small mono">{c.fp}</td><td className="small">{c.emails.join(", ")}</td></tr>))}
      </tbody></table></div>}
    </div>
    <div className="card" style={{marginTop:12}}><h3>Risk list ({d.rows.length})</h3>
      {d.rows.length===0?<p className="muted small">No suspicious users right now.</p>:
      <div className="table-wrap" style={{border:0}}><table><thead><tr><th>User</th><th>Risk</th><th>Signals</th><th>Earn/Fail/VPN</th></tr></thead><tbody>
        {d.rows.map(r=>(<tr key={r.userId}><td className="small">{r.email}<br/><span className="muted">{r.plan} · since {String(r.createdAt).slice(0,10)}</span></td><td>{risk(r.score)}</td><td className="small">{r.signals.join(" · ")}</td><td className="small">{r.earnsToday}/{r.fails24h}/{r.vpn24h}</td></tr>))}
      </tbody></table></div>}
    </div>
  </div>);
}
