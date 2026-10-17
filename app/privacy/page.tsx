import type { Metadata } from "next";
import PageHero from "../../components/PageHero";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Roun privacy policy: what we collect, how your code and files are processed, how long they are kept and when they reach third-party AI services.",
};
import Link from "next/link";
import Reveal from "../../components/Reveal";

const SUPPORT_MAIL = "talhamoyelolo52@gmail.com";

export default function Privacy() {
  return (
    <div className="prose">
      <PageHero
        kicker="Legal"
        title={<>Privacy <span className="grad-anim">Policy</span></>}
        sub="Exactly what we collect, how it is processed, how long we keep it, and when it reaches an AI service. Last updated 17 Oct 2026."
      />

      <Reveal variant="left">
        <h3>1. Who runs Roun</h3>
        <p>
          Roun (&ldquo;the Service&rdquo;, roun.sryze.cc) is built and operated by <strong>Tanvir Islam (Bangladesh)</strong>.
          Payments, invoices and tax documents for paid plans are handled by <strong>Paddle.com</strong> as merchant of
          record, not by us. Questions about this policy? Open a ticket at <Link href="/support">/support</Link> or
          email <a href={"mailto:" + SUPPORT_MAIL}>{SUPPORT_MAIL}</a>.
        </p>
      </Reveal>

      <Reveal variant="left" delay={60}>
        <h3>2. What we collect</h3>
        <ul>
          <li>
            <strong>Account:</strong> email address + a bcrypt password hash (we never see or store your plain
            password), and your coin balance/usage counters.
          </li>
          <li>
            <strong>Build requests:</strong> title, instructions (capped at 20,000 characters) and the files you attach
            (max 50 files, 200 KB total), together with the build log, result text, produced artifacts and the coin
            charge that was held/charged for the request.
          </li>
          <li>
            <strong>Game Studio requests:</strong> your game prompts (capped at 500 characters), the generated plan,
            the generated single-file HTML game and the coins it cost.
          </li>
          <li>
            <strong>Service events:</strong> coin transactions, ad-for-coins reward records (max 10/day), request
            activity events, support tickets and replies, and minimal security counters (e.g. failed-login and
            rate-limit records kept only for abuse prevention, automatically trimmed).
          </li>
          <li>
            <strong>Admin-side secrets</strong> (build tokens, AI keys, webhook secrets) only for admin accounts,
            stored encrypted — see <Link href="/security">/security</Link>.
          </li>
        </ul>
      </Reveal>

      <Reveal variant="left" delay={60}>
        <h3>3. How your code and files are processed</h3>
        <p>
          You never give us a repository: code reaches us only when you attach files (or paste instructions) to a
          request. From that point:
        </p>
        <ol>
          <li>
            The request and its files are stored in our application database
            (<strong>Firebase Realtime Database on Google infrastructure</strong>, path <em>codebridge/maindb</em>),
            over HTTPS.
          </li>
          <li>
            To build it, the files are downloaded by an <strong>ephemeral GitHub Actions runner</strong> into an
            isolated <code>task-work/</code> folder on that VM. The runner VM lives only for that one job and is
            discarded when the run ends.
          </li>
          <li>
            Inside the runner the build is executed by an <strong>AI coding agent</strong> (OpenCode), so your
            instructions and file contents become the agent&rsquo;s working context. Project type (Python, Java,
            Android, Node&hellip;) is auto-detected from your file names and the matching toolchain runs.
          </li>
          <li>
            In <strong>fix-compile</strong> mode and in <strong>Game Studio</strong>, your code/prompt is also sent to
            third-party AI models via <strong>OpenRouter</strong> (currently Google, Cohere, NVIDIA and Poolside models,
            presented to you as &ldquo;Roun Co Pilot&rdquo;). Those providers process the content under their own terms
            and may retain it according to their policies; free OpenRouter models can share data with the upstream
            provider for improvement. <strong>If your files contain passwords, API keys or customers&rsquo; personal
            data — remove them before sending.</strong>
          </li>
          <li>The log, result and artifacts are sent back to your dashboard. The runner VM is thrown away.</li>
        </ol>
        <p className="muted small">
          We do not train models on your data, we do not sell it, and we do not use build content for ads.
        </p>
      </Reveal>

      <Reveal variant="left" delay={60}>
        <h3>4. How long we keep it</h3>
        <ul>
          <li>
            <strong>Requests, files, logs and results</strong> are kept while your account exists so you can revisit
            them in the dashboard.
          </li>
          <li>
            <strong>Deletion on request:</strong> open <Link href="/support">/support</Link> with subject
            &ldquo;Delete my data&rdquo; and we delete your build history, files, and account. We aim to complete
            deletion within 7 days.
          </li>
          <li>
            <strong>Security counters</strong> (failed logins, rate-limit hits, bans) are kept only for abuse
            prevention and are automatically trimmed to a bounded recent list.
          </li>
          <li><strong>Sessions:</strong> login cookies expire when you log out or per their validity window.</li>
          <li>
            <strong>Billing records</strong> for paid orders are held by Paddle as merchant of record and follow
            Paddle&rsquo;s own retention policy and legal obligations (tax records).
          </li>
        </ul>
      </Reveal>

      <Reveal variant="left" delay={60}>
        <h3>5. Third parties we rely on</h3>
        <ul>
          <li><strong>Google (Firebase)</strong> — application database storage.</li>
          <li><strong>GitHub</strong> — ephemeral build runners and the pipeline that drives them.</li>
          <li><strong>OpenRouter + model providers</strong> — AI processing for fixes and Game Studio (section 3).</li>
          <li><strong>Paddle.com</strong> — checkout, payments, invoices and refunds (merchant of record).</li>
          <li><strong>Google Analytics 4</strong> — traffic analytics, served through a first-party proxy on our own domain.</li>
          <li><strong>Monetag</strong> — advertising on public pages (vignette/in-page formats; auth pages are excluded).</li>
          <li><strong>Cloudflare</strong> — network transport (Tunnel) and TLS.</li>
          <li><strong>Our own mail service</strong> — account emails (login OTP / password reset, no marketing).</li>
        </ul>
      </Reveal>

      <Reveal variant="left" delay={60}>
        <h3>6. Cookies</h3>
        <ul>
          <li><code>session</code> cookie (httpOnly) — required for login state. No tracking cookies are set by Roun itself.</li>
          <li>Analytics (GA4) and Monetag ad scripts may set their own cookies/device identifiers when they load on public pages.</li>
        </ul>
      </Reveal>

      <Reveal variant="left" delay={60}>
        <h3>7. Your rights</h3>
        <p className="muted small">
          Access and export: your requests, results and balances are always visible in the dashboard and
          <Link href="/docs"> /docs</Link> spells out the API to fetch them. Deletion: the ticket flow above works as
          your universal eraser tool. We are a small operator — we honor legitimate GDPR/CCPA-style requests (access,
          deletion, correction) by hand through tickets; we never keep data beyond what is described above.
        </p>
      </Reveal>

      <Reveal variant="left" delay={60}>
        <h3>8. Children &amp; data source</h3>
        <p className="muted small">
          Roun is not intended for children under 13, and we do not knowingly keep their data. We process only data you
          send us directly; there is no public scraping or source-merging involved.
        </p>
      </Reveal>

      <Reveal variant="left" delay={60}>
        <h3>9. Changes</h3>
        <p className="muted small">
          Significant changes to this policy will be announced on the dashboard before they take effect. The site text
          above is the authoritative version.
        </p>
      </Reveal>
    </div>
  );
}
