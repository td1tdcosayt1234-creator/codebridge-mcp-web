import Link from "next/link";
import CopyBtn from "../components/CopyBtn";
import Counter from "../components/Counter";
import Reveal from "../components/Reveal";
import TerminalDemo from "../components/TerminalDemo";
import Tilt from "../components/Tilt";

const STACK = [
  "Python",
  "Node.js",
  "Go",
  "Rust",
  "Java",
  "C++",
  "TypeScript",
  "PHP",
  "Ruby",
  "Swift",
  "Android",
  "C#",
];

const ICONS = {
  plug: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 3v6M15 3v6M7 9h10v3a5 5 0 0 1-10 0V9ZM12 17v4" />
    </svg>
  ),
  bolt: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
    </svg>
  ),
  wrench: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14.7 6.3a4 4 0 0 0 5 5L16 15l-3 3-1-1-1 1-1-1 1-1-1-1 1-1Z" />
      <path d="m6 3 3 3-2 2-3-3" />
    </svg>
  ),
  coin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v8M10 10h3a1.5 1.5 0 0 1 0 3h-2a1.5 1.5 0 0 0 0 3h3" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3 5 6v5c0 4 3 7 7 8 4-1 7-4 7-8V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  gamepad: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 8h10a4 4 0 0 1 4 4v1a3 3 0 0 1-5 2l-1-1H9l-1 1a3 3 0 0 1-5-2v-1a4 4 0 0 1 4-4Z" />
      <path d="M7 11v3M5.5 12.5h3M16 12h.01M18 14h.01" />
    </svg>
  ),
};

const STEPS = [
  {
    n: "01",
    title: "Send the request",
    body: (
      <>
        A title, a few instructions, your files. From the dashboard or straight from your agent — that is the entire
        setup. No repo to clone, no key to rotate.
      </>
    ),
  },
  {
    n: "02",
    title: "Real build, real cloud",
    body: (
      <>
        An isolated runner picks up the job and runs the actual toolchain — <code>npm run build</code>,{" "}
        <code>go build</code>, <code>cargo</code>, <code>pytest</code>, <code>assembleDebug</code> — then reads the
        failure output and repairs it.
      </>
    ),
  },
  {
    n: "03",
    title: "Result comes home",
    body: (
      <>
        Logs, artifacts and APKs land back on the dashboard and inside the agent call, so the session keeps moving
        while the work happens somewhere else.
      </>
    ),
  },
];

const BEFORE = [
  "Copy files into a CI dashboard by hand",
  "Watch a queue you cannot influence",
  "Read the log, guess the fix, retry, wait again",
  "Hold local toolchains and Docker images hostage",
  "Pay for runners whether the build passes or not",
];

const AFTER = [
  "One request from the agent or the web",
  "Real toolchains on an isolated runner",
  "AI reads the error and repairs the source itself",
  "Full logs, artifacts and APKs returned automatically",
  "Charged on the result, not the guesswork",
];

const AGENT_STEPS = [
  { n: "1", t: "Copy your key", d: <>Open <Link href="/dashboard/mcp">/dashboard/mcp</Link> and copy the personal key. It is shown once and never in full again.</> },
  { n: "2", t: "Paste one block", d: <>Drop it into your agent config. OpenCode, Claude and Cursor all read the same shape.</> },
  { n: "3", t: "Ask for a build", d: <>Say <em>&ldquo;compile my files&rdquo;</em> and the result comes back inside the conversation.</> },
];

const FEATURES = [
  { icon: "plug", title: "Agent-native MCP", body: "Six tools — compile, auto-fix, task search, results, issues and one-click approval. Connect once and builds happen without opening a browser." },
  { icon: "bolt", title: "Real toolchains", body: "Not a simulator. Actual compilers and test runners execute on isolated runners and report exactly what happened." },
  { icon: "wrench", title: "Self-repairing", body: "The agent reads the error context, patches the source and retries up to three times before it gives up." },
  { icon: "coin", title: "Pay for results", body: "Coins are estimated on request, held, then charged against the real output. Nothing wasted on a failed run." },
  { icon: "shield", title: "Locked down", body: "bcrypt passwords, httpOnly sessions, encrypted token vault, lockouts, rate limits and a full audit trail." },
  { icon: "gamepad", title: "Game Studio", body: "Describe a game in one sentence and play a single-file HTML build instantly. Same account, same platform." },
];

const CONFIG = `{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "codebridge": {
      "type": "remote",
      "url": "http://localhost:3001/api/mcp",
      "headers": { "Authorization": "Bearer YOUR_KEY" }
    }
  }
}`;

const PROMPT_EXAMPLE = `compile my attached files
(or compile_fix to auto-fix errors)`;

const FAQ_TEASER = [
  ["Do I need a card to start?", "No. Signup gives you 10,000 coins and the full dashboard. No card, no trial timer."],
  ["What does a build cost?", "Coins scale with file size — roughly 1 coin per 4 characters. The estimate is held on request and settled against the real output."],
  ["Which stacks are supported?", "Python, Node, Go, Rust, Java, C++, TypeScript, PHP, Ruby, Swift, C# and Android — real builds, not simulations."],
];

function Word({ children, delay }: { children: string; delay: number }) {
  return (
    <span className="word-mask">
      <span style={{ animationDelay: `${delay}ms` }}>{children}</span>
    </span>
  );
}

export default function Home() {
  return (
    <div>
      {/* ================= HERO ================= */}
      <section className="cine-hero">
        <div className="hero-orbit" aria-hidden="true">
          <div className="ring ring--1" />
          <div className="ring ring--2" />
          <div className="ring ring--3" />
        </div>

        <div className="hero-grid">
          <div className="hero-copy">
            <div className="kicker fade-up d1">
              <span className="pulse-dot" />
              AI compile cloud · self-repairing builds
            </div>

            <h1>
              <Word delay={80}>Stop</Word> <Word delay={150}>babysitting</Word> <Word delay={220}>builds.</Word>
              <br />
              <span className="grad-anim text-glow">
                <Word delay={300}>Ship</Word> <Word delay={370}>code,</Word> <Word delay={440}>not</Word>{" "}
                <Word delay={510}>commands.</Word>
              </span>
            </h1>

            <p className="fade-up d5">
              Send one request from your agent or the web. CodeBridge runs a real build on an isolated cloud runner,
              repairs the failures itself, and hands the artifact back — full logs, zero infrastructure on your side.
            </p>

            <div className="hero-cta fade-up d6">
              <Link className="btn btn-lg shine" href="/signup">
                Start free — 10k coins
              </Link>
              <Link className="btn-ghost btn-lg" href="/mcp">
                Connect your agent
              </Link>
            </div>

            <div className="hero-meta fade-up d7">
              <span className="chip">
                <b>●</b> runners online
              </span>
              <span className="chip">no credit card</span>
              <span className="chip">cancel anytime</span>
            </div>
          </div>

          <div className="fade-up d6">
            <TerminalDemo />
          </div>
        </div>

        <div className="flow fade-up d8">
          {[
            ["Request", "web or agent"],
            ["Queue", "dispatched"],
            ["Cloud build", "compile + fix"],
            ["Result", "logs + artifacts"],
          ].map(([title, sub], i, arr) => (
            <div key={title} style={{ display: "contents" }}>
              <div className="fnode">
                <b>{title}</b>
                <span>{sub}</span>
              </div>
              {i < arr.length - 1 && <div className="farrow" />}
            </div>
          ))}
        </div>
      </section>

      {/* ================= SUPPORTED STACKS ================= */}
      <div className="stack-band">
        <div className="stack-band-label">
          <i />
          Runs on
        </div>
        <div className="marquee" aria-hidden="true">
          <div className="marquee-track">
            {[...STACK, ...STACK].map((s, i) => (
              <span key={i}>
                <b>◆</b>
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ================= 01 · HOW IT WORKS ================= */}
      <section className="section">
        <Reveal>
          <div className="section-head">
            <div className="sec-index">
              <b>01</b> / How it works
            </div>
            <h2>
              One request. <span className="grad">The whole loop.</span>
            </h2>
            <p className="sub">
              Connect once and every build after that runs itself. No runners to install, no CI YAML to babysit, no
              terminal sitting idle while you wait.
            </p>
          </div>
        </Reveal>

        <div className="timeline">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 130} variant={i % 2 ? "right" : "left"}>
              <div className="tl-step">
                <div className="tl-dot">{s.n}</div>
                <div className="tl-body">
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ================= 02 · THE DIFFERENCE ================= */}
      <section className="section" style={{ paddingTop: 0 }}>
        <Reveal>
          <div className="section-head">
            <div className="sec-index">
              <b>02</b> / The difference
            </div>
            <h2>
              Same build. <span className="grad">None of the ceremony.</span>
            </h2>
            <p className="sub">The compiler does not change. Everything around it does.</p>
          </div>
        </Reveal>

        <div className="ba-grid">
          <Reveal variant="left">
            <div className="ba-card ba-card--before">
              <span className="ba-tag">The old loop</span>
              <h3>Manual build babysitting</h3>
              <p className="muted small">What shipping normally costs you.</p>
              <ul className="ba-list">
                {BEFORE.map((b) => (
                  <li key={b}>
                    <span className="m m--x">✕</span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal variant="scale" delay={110}>
            <div className="ba-vs">VS</div>
          </Reveal>

          <Reveal variant="right" delay={160}>
            <div className="ba-card ba-card--after holo">
              <span className="ba-tag">With CodeBridge</span>
              <h3>Request, result, done</h3>
              <p className="muted small">What it costs now.</p>
              <ul className="ba-list">
                {AFTER.map((a) => (
                  <li key={a}>
                    <span className="m m--v">✓</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= 03 · AGENT CONNECT ================= */}
      <section className="section" style={{ paddingTop: 0 }}>
        <Reveal>
          <div className="section-head">
            <div className="sec-index">
              <b>03</b> / Agent connect
            </div>
            <h2>
              Your agent already knows how. <span className="grad">Just give it the URL.</span>
            </h2>
          </div>
        </Reveal>

        <div className="agent-grid">
          <Reveal variant="left">
            <div>
              <p className="muted" style={{ fontSize: 16, lineHeight: 1.75, maxWidth: 460 }}>
                CodeBridge speaks MCP, so your coding agent gets build tools without learning a new API. Three steps,
                once, and every future build is a single sentence.
              </p>
              <ul className="agent-list">
                {AGENT_STEPS.map((s) => (
                  <li key={s.n}>
                    <span className="n">{s.n}</span>
                    <span>
                      <strong style={{ color: "var(--text)" }}>{s.t}.</strong> {s.d}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="client-chips">
                {["OpenCode", "Claude", "Cursor", "Any MCP client"].map((c) => (
                  <span key={c} className="chip">
                    {c}
                  </span>
                ))}
              </div>
              <Link className="btn-ghost" style={{ marginTop: 22 }} href="/docs">
                Read the setup guide
              </Link>
            </div>
          </Reveal>

          <Reveal variant="right" delay={120}>
            <Tilt strength={5} glare={false}>
              <div className="holo" style={{ borderRadius: 20 }}>
                <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                  <div className="codeblock-bar">
                    <span>opencode.json</span>
                    <CopyBtn text={CONFIG} />
                  </div>
                  <pre style={{ border: 0, borderRadius: 0 }}>{CONFIG}</pre>
                  <div className="codeblock-bar" style={{ borderTop: "1px solid var(--line)", borderBottom: 0 }}>
                    <span>then ask the agent</span>
                    <CopyBtn text={PROMPT_EXAMPLE} />
                  </div>
                  <pre style={{ border: 0, borderRadius: 0, paddingTop: 0 }}>{PROMPT_EXAMPLE}</pre>
                </div>
              </div>
            </Tilt>
          </Reveal>
        </div>
      </section>

      {/* ================= GAME STUDIO ================= */}
      <Reveal>
        <div className="promo-band">
          <div className="promo-inner">
            <div className="promo-art">{ICONS.gamepad}</div>
            <div style={{ flex: 1, minWidth: 250 }}>
              <div className="kicker" style={{ marginBottom: 8 }}>
                <span className="pulse-dot" />
                Game Studio
              </div>
              <h2 style={{ margin: "0 0 6px", fontSize: 25, letterSpacing: "-0.03em" }}>
                Describe a game. Play it in seconds.
              </h2>
              <p className="muted small" style={{ margin: 0 }}>
                No deploy, no build pipeline — type &ldquo;neon snake&rdquo; and get a playable single-file HTML game
                right in the browser.
              </p>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link className="btn" href="/game">
                Open Game Studio
              </Link>
            </div>
          </div>
        </div>
      </Reveal>

      {/* ================= 04 · CAPABILITIES ================= */}
      <section className="section">
        <Reveal>
          <div className="section-head">
            <div className="sec-index">
              <b>04</b> / Capabilities
            </div>
            <h2>
              Everything the <span className="grad">middle layer</span> needs
            </h2>
            <p className="sub">From request to artifact, CodeBridge owns the boring half of shipping software.</p>
          </div>
        </Reveal>

        <div className="grid g3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 110} variant="scale">
              <Tilt strength={6}>
                <article className="card">
                  <div className="feat">{ICONS[f.icon as keyof typeof ICONS]}</div>
                  <h3>{f.title}</h3>
                  <p className="muted small">{f.body}</p>
                </article>
              </Tilt>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ================= STATS ================= */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="grid g3">
          {[
            { v: 6, suffix: "", label: "agent tools total" },
            { v: 10, suffix: "k", label: "free coins included" },
            { v: 0, suffix: "", label: "local setup required" },
          ].map((s, i) => (
            <Reveal key={s.label} delay={i * 110}>
              <div className="card stat holo">
                <b className="grad-anim">
                  <Counter value={s.v} suffix={s.suffix} />
                </b>
                <span>{s.label}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ================= 05 · FAQ TEASER ================= */}
      <section className="section" style={{ paddingTop: 0 }}>
        <Reveal>
          <div className="section-head">
            <div className="sec-index">
              <b>05</b> / Good to know
            </div>
            <h2>
              Questions, <span className="grad">answered</span>
            </h2>
          </div>
        </Reveal>

        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          {FAQ_TEASER.map(([q, a], i) => (
            <Reveal key={q} delay={i * 90} variant="left">
              <details className="faq" open={i === 0}>
                <summary>
                  <span className="q-ico">+</span>
                  {q}
                </summary>
                <div className="a">{a}</div>
              </details>
            </Reveal>
          ))}
          <Reveal delay={200} variant="scale">
            <div style={{ textAlign: "center", marginTop: 20 }}>
              <Link className="btn-ghost" href="/faq">
                Read all {13} questions
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <Reveal>
        <div className="cta holo">
          <h2>
            Start building <span className="grad">without the busywork</span>
          </h2>
          <p>10,000 coins on the house. No card, no setup, no idle terminals.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 24 }}>
            <Link className="btn btn-lg shine" href="/signup">
              Create free account
            </Link>
            <Link className="btn-ghost btn-lg" href="/pricing">
              See pricing
            </Link>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
