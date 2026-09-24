import PageHero from "../../components/PageHero";
import Reveal from "../../components/Reveal";

export default function Terms() {
  return (
    <div className="prose">
      <PageHero kicker="Legal" title={<>Terms of <span className="grad-anim">Use</span></>} sub="Short and clear. Using the service means you accept them." />

      <Reveal variant="left">
        <h3>1. Service</h3>
        <p>CodeBridge compiles your web requests with AI in the cloud (compile only, all types). Fair-use limits of the cloud backend apply.</p>
      </Reveal>
      <Reveal variant="left" delay={60}>
        <h3>2. Account + tokens</h3>
        <p>One email = one account. Keep your password safe. Free balance is 10,000 tokens (1 ≈ 4 chars); bigger files cost more. The dashboard requires login; admin pages return 404 without admin login. Abuse leads to suspension. Extra tokens can be earned by watching ads (+50 each, max 10/day).</p>
      </Reveal>
      <Reveal variant="left" delay={60}>
        <h3>3. Your code</h3>
        <p>Files and prompts you send are yours. Review them before sending — you pay the fail/fix charges for wrong instructions.</p>
      </Reveal>
      <Reveal variant="left" delay={60}>
        <h3>4. Prohibited</h3>
        <ul>
          <li>Spam requests / balance abuse / scraping other tokens</li>
          <li>Malware or illegal content</li>
          <li>Unauthorized access attempts to admin/runner endpoints</li>
        </ul>
        <p>Violations lead to suspension without warning.</p>
      </Reveal>
      <Reveal variant="left" delay={60}>
        <h3>5. Liability</h3>
        <p>&ldquo;As-is&rdquo; service. Max liability for build failures, downtime or data loss = what you paid last month ($0 on free). Keep backups of critical code.</p>
      </Reveal>
      <Reveal variant="left" delay={60}>
        <h3>6. Changes</h3>
        <p>Term changes are announced on the dashboard. Questions? <a href="/support">/support</a>.</p>
      </Reveal>
    </div>
  );
}
