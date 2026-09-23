import Link from "next/link";
const faqs=[
["Is Free really free? Do I need a card?","Yes. 10,000 coins, dashboard + tracking included. No card. Earn more by watching ads or upgrade to Pro."],
["What do I need to install or configure?","Nothing. Sign up, log in, send a request. No tokens, keys, repos or setup on your side."],
["Does it only compile? All types?","Yes — compile only, all types (Python, Node, Go...)."],
["How are coins charged?","Bigger files cost more: 1 coin ≈ 4 chars. Held on request, finally charged on output size. See /dashboard/tokens for balance and per-request history."],
["What is fix-with-compile?","On failure, the AI fixes the code itself and retries up to 3 times — bigger fixes cost more. Pick fix-compile mode in /dashboard/tasks."],
["How do I earn free coins?","Watch ads in /dashboard/earn: +50 coins per full ad, max 10 per day. Ad blocker and VPN must be off; watch time is verified server-side, skipping pays nothing."],
["How do I connect my coding agent?","Signup/login on the web first, then copy your personal key from /dashboard/mcp into the agent config headers (see /mcp), and restart the agent app. Anonymous use is disabled."],
["Is my data safe?","Passwords are bcrypt-hashed, sessions are httpOnly cookies, secrets encrypted and never shown, logins rate-limited + locked after 5 fails, bots/VPN blocked, everything audit-logged."],
["What does 402 / 'low balance' mean?","Not enough coins for the file size. Split into smaller requests or earn coins via ads."],
["I added the agent entry but no tools appear?","Config loads once at startup — quit and restart the agent app. Also check the server URL and website login."],
["Why 'Bot detected'?","A hidden anti-bot field was filled — usually means an autofill bot. Fill the form manually in a real browser."],
["Why 'VPN/Proxy not allowed'?","Earnings and signup are blocked over VPN/proxy to stop abuse. Disable it and retry."],
["Where do I get support?","Open a ticket in /support — the admin replies from the dashboard. Reading /docs first solves most issues faster."],
];
export default function Faq(){ return (<div className="prose">
  <div className="page-hero" style={{textAlign:"center"}}>
    <div className="kicker" style={{marginBottom:12}}><span className="pulse-dot" />{faqs.length} answers</div>
    <h1>FAQ — <span className="grad-anim">all answers</span></h1>
    <p style={{margin:"0 auto"}}>Still confused? Read <Link href="/docs">/docs</Link> or open a ticket in <Link href="/support">/support</Link>.</p>
  </div>
  {faqs.map(([q,a],i)=>(
    <details key={q} className="faq" open={i===0}>
      <summary><span className="q-ico">+</span>{q}</summary>
      <div className="a">{a}</div>
    </details>
  ))}
  <div className="cta"><h2>Still stuck?</h2><p>Open a support ticket — admin replies from the dashboard.</p><div style={{display:"flex",gap:10,justifyContent:"center",marginTop:14}}><Link className="btn" href="/support">Open ticket</Link><Link className="btn-ghost" href="/docs">Read docs</Link></div></div>
</div>); }
