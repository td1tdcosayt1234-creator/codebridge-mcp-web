import PageHero from "../../components/PageHero";
import Reveal from "../../components/Reveal";

export default function Privacy() {
  return (
    <div className="prose">
      <PageHero kicker="Legal" title={<>Privacy <span className="grad-anim">Policy</span></>} sub="What we store and how to delete it." />

      <Reveal variant="left">
        <h3>1. What we store</h3>
        <ul>
          <li>Email + bcrypt password hash (never plain passwords)</li>
          <li>Requests: title, instructions, attached files, AI output logs/results, coin charges</li>
          <li>Backend secrets — <strong>admin only</strong>, encrypted, never shown in full</li>
          <li>Coin balance/usage, ad-view records, activity events, support tickets</li>
        </ul>
      </Reveal>
      <Reveal variant="left" delay={60}>
        <h3>2. How it is used</h3>
        <p>Login sessions (httpOnly JWT cookies), token resolution for MCP calls, quota counting, abuse prevention, support replies. Data is never sold or shared for ads.</p>
      </Reveal>
      <Reveal variant="left" delay={60}>
        <h3>3. Who can see it</h3>
        <p>You see your own dashboard; admins see aggregate monitoring (users, usage, tasks) for support and security. Admins can never see your password or tokens in plain text.</p>
      </Reveal>
      <Reveal variant="left" delay={60}>
        <h3>4. Deletion</h3>
        <p>To delete your account + data, open a ticket in <a href="/support">/support</a> (subject: &ldquo;Delete my data&rdquo;). Backend secrets are managed by the admin.</p>
      </Reveal>
      <Reveal variant="left" delay={60}>
        <h3>5. Security</h3>
        <p>Encrypted vaults, httpOnly cookies, role checks, rate limits, login lockout, audit logs. Still no 100% guarantee — never push highly sensitive secrets (bank keys etc.) through an agent.</p>
      </Reveal>
    </div>
  );
}
