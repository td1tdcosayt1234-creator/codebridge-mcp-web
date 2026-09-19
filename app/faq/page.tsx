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
export default function Faq(){ return (<div className="prose"><div className="page-hero"><h1>FAQ — <span className="grad">all answers</span></h1><p>Still confused? Read /docs or open a ticket in /support.</p></div>{faqs.map(([q,a])=>(<div key={q} className="card" style={{marginBottom:10}}><b>{q}</b><p className="muted small" style={{marginBottom:0}}>{a}</p></div>))}</div>); }
