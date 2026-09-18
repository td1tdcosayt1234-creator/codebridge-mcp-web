export default function Privacy(){
  return (<div className="prose"><div className="page-hero"><h1>Privacy Policy</h1><p>Tomar data kivabe rakhi + kivabe delete korba.</p></div>
  <h3>1. Ki store kori</h3><ul><li>Email + bcrypt password hash (plain password kokhono na)</li><li>GitHub Classic Token — <b>shudhu admin er ta</b>, AES-256-GCM encrypted, UI/log e kokhono full na</li><li>MCP key, build metadata + logs, token usage count, activity events, support tickets</li></ul>
  <h3>2. Kivabe use hoy</h3><p>Login session (httpOnly JWT cookie), MCP tool call e token resolve, quota count, abuse prevent, support reply. Data sell hoy na, ads er jonno share hoy na.</p>
  <h3>3. Ke dekhte pare</h3><p>Tumi tomar dashboard; admin aggregate monitor (user list, usage, builds) support + security er jonno. Admin tomar password/token plain dekhte pare na.</p>
  <h3>4. Delete</h3><p>Account + data delete chaile <a href="/support">/support</a> e ticket kholo (subject: “Delete my data”). Admin global token admin nije <a href="/admin/github">/admin/github</a> theke remove korte pare.</p>
  <h3>5. Security</h3><p>Encrypted vault, httpOnly cookies, role check, audit logs. Tao 100% guarantee nai — sensitive secret (bank key etc.) agent diye push koro na.</p>
  </div>);
}
