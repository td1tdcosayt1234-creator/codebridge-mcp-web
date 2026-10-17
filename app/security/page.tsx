import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "../../components/PageHero";
import Reveal from "../../components/Reveal";

export const metadata: Metadata = {
  title: "Security",
  description:
    "Roun security model: ephemeral build isolation, API-key handling, data deletion and vulnerability reporting.",
};

export default function Security() {
  return (
    <div className="prose">
      <PageHero
        kicker="Security"
        title={<>How we keep your code <span className="grad-anim">contained</span></>}
        sub="This page describes what actually happens in the platform — taken from the real request pipeline, not marketing copy."
      />

      <Reveal variant="left">
        <h3>1. Build isolation</h3>
        <ul>
          <li>
            <strong>Your files never touch our servers&rsquo; workspaces.</strong> A build runs on a fresh
            GitHub-hosted Actions VM (ubuntu-latest). Files are downloaded there into an isolated
            <code> task-work/</code> directory; other tenants and our web servers can never see the VM.
          </li>
          <li>
            <strong>Path containment:</strong> every uploaded path has leading slashes, NUL bytes and
            <code>.</code>/<code>..</code> segments resolved away and is capped at 200 characters — a file named
            <code>../../secret</code> can never escape <em>task-work/</em>.
          </li>
          <li>
            <strong>Junk + artifact filter:</strong> build outputs and dependency folders (.git, node_modules, build,
            dist, out, target, __pycache__, .gradle, .next&hellip;) and binaries (.exe, .dll, .so, .apk, .jar, .zip,
            .class, .o&hellip;) are rejected at upload — only source enters the pipeline.
          </li>
          <li>
            <strong>Hard caps:</strong> max 50 files, 200 KB total, ~100 KB per file, title ≤ 200 characters,
            instructions ≤ 20,000 characters.
          </li>
          <li>
            <strong>One-way lifecycle:</strong> the task is persisted <em>before</em> dispatch (no orphan builds if a
            process dies), and a finished task can never flip back to &ldquo;running&rdquo; — a leaked runner token
            cannot double-charge or reset a result.
          </li>
          <li>
            <strong>Runner authentication:</strong> two layers — a global runner bearer token plus a one-time
            per-task nonce issued when the runner claims the task. Both are compared in constant time.
          </li>
          <li>
            <strong>Verified callbacks only:</strong> the runner may set <code>run_url</code> only to a real
            <code>github.com/&lt;owner&gt;/&lt;repo&gt;/actions/runs/&lt;id&gt;</code> URL, so nothing phishy can be
            rendered in your dashboard.
          </li>
          <li><strong>The VM is discarded when the job ends.</strong> Nothing survives on it.</li>
        </ul>
      </Reveal>

      <Reveal variant="left" delay={60}>
        <h3>2. API-key and secret handling</h3>
        <ul>
          <li><strong>Passwords</strong> — bcrypt hashes only; plain passwords are never stored or logged.</li>
          <li><strong>Sessions</strong> — short-lived JWT in an httpOnly cookie; login lockout (5 fails → 15 minutes), per-IP rate limits and automatic bans on abuse endpoints.</li>
          <li>
            <strong>At-rest encryption</strong> — the GitHub build token, AI keys, webhook secrets, runner tokens and
            admin secrets are stored AES-256-GCM encrypted. The dashboard reveals only a masked hint, never the value.
          </li>
          <li>
            <strong>Two-factor admin access</strong> — sensitive admin actions (billing vaults, settings) require a
            fresh TOTP step-up code, not just a session.
          </li>
          <li>
            <strong>MCP keys</strong> — personal, issued from your dashboard; every MCP call resolves back to your
            account only.
          </li>
          <li>
            <strong>Payment integrity</strong> — Paddle webhooks must carry a valid HMAC-SHA256 signature with a fresh
            timestamp; <code>event_id</code> dedup prevents double-crediting and the paid price must match the plan.
          </li>
          <li>
            <strong>Transport</strong> — TLS via Cloudflare, CSP, HSTS, <code>X-Frame-Options: DENY</code>,
            <code> nosniff</code> and a strict referrer policy on every page.
          </li>
        </ul>
      </Reveal>

      <Reveal variant="left" delay={60}>
        <h3>3. Data deletion</h3>
        <p>
          Open <Link href="/support">/support</Link> with subject <em>&ldquo;Delete my data&rdquo;</em> and we delete
          your account, build history, uploaded files, logs, game history and tickets from the backend database. We aim
          to complete deletion within 7 days. What remains afterwards: only the automatic abuse-prevention counters
          (already trimmed, no content) and any billing records that Paddle, as merchant of record, is required to keep
          under tax law.
        </p>
      </Reveal>

      <Reveal variant="left" delay={60}>
        <h3>4. Vulnerability reporting</h3>
        <p>
          Found something? Do <strong>not</strong> open a public GitHub issue. Report it with the subject
          <em> &ldquo;Security&rdquo;</em> at <Link href="/support">/support</Link> (or email
          talhamoyelolo52@gmail.com) with steps to reproduce. We acknowledge reports within a few days and coordinate
          public disclosure after a fix ships. No bug bounty for now — but we credit reporters by handle in the fix
          note if they want.
        </p>
      </Reveal>

      <Reveal variant="left" delay={60}>
        <h3>5. Honest caveats</h3>
        <ul>
          <li>
            <strong>AI is in the loop.</strong> Builds are executed by an AI coding agent and fix-compile/Game Studio
            calls reach third-party AI providers — details in the
            <Link href="/privacy"> privacy policy</Link>. Do not upload credentials or other people&rsquo;s personal
            data.
          </li>
          <li>
            <strong>Review output before running.</strong> Treat generated code/builds as untrusted until you checked
            them like any other internet download.
          </li>
          <li>
            <strong>Your GitHub expose is yours.</strong> Roun never clones your repositories; only what you upload to
            a request enters the build environment.
          </li>
        </ul>
      </Reveal>
    </div>
  );
}
