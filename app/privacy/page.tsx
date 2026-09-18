export default function Privacy(){
  return (<div className="prose"><div className="page-hero"><h1>Privacy Policy</h1><p>What we store and how to delete it.</p></div>
  <h3>1. What we store</h3><ul><li>Email + bcrypt password hash (never plain passwords)</li><li>Requests: title, instructions, attached files, AI output logs/results, coin charges</li><li>Backend secrets — <b>admin only</b>, encrypted, never shown in full</li><li>Coin balance/usage, ad-view records, activity events, support tickets</li></ul>
  <h3>2. How it is used</h3><p>Login sessions (httpOnly JWT cookies), token resolution for MCP calls, quota counting, abuse prevention, support replies. Data is never sold or shared for ads.</p>
  <h3>3. Who can see it</h3><p>You see your own dashboard; admins see aggregate monitoring (users, usage, tasks) for support and security. Admins can never see your password or tokens in plain text.</p>
  <h3>4. Deletion</h3><p>To delete your account + data, open a ticket in <a href="/support">/support</a> (subject: “Delete my data”). Backend secrets are managed by the admin.</p>
  <h3>5. Security</h3><p>Encrypted vaults, httpOnly cookies, role checks, rate limits, login lockout, audit logs. Still no 100% guarantee — never push highly sensitive secrets (bank keys etc.) through an agent.</p>
  </div>);
}
