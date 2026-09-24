import Link from "next/link";
import Counter from "../../components/Counter";
import PageHero from "../../components/PageHero";
import Reveal from "../../components/Reveal";
import Tilt from "../../components/Tilt";

export default function About() {
  return (
    <div className="prose">
      <PageHero
        kicker="Our story"
        title={<>About <span className="grad-anim text-glow">CodeBridge</span></>}
        sub="Send a compile request on the web → AI compiles it in the cloud and fixes errors itself → the output comes back here → you read the result. No setup, no infrastructure on your side."
      />

      <div className="hero-stats-row" style={{ justifyContent: "center", marginBottom: 34 }}>
        {[
          { v: 2, label: "agent tools", suffix: "" },
          { v: 10, label: "free coins", suffix: "k" },
          { v: 0, label: "setup needed", suffix: "" },
        ].map((s, i) => (
          <Reveal key={s.label} delay={i * 100} variant="scale">
            <div className="card stat" style={{ minWidth: 168 }}>
              <b className="grad-anim">
                <Counter value={s.v} suffix={s.suffix} />
              </b>
              <span>{s.label}</span>
            </div>
          </Reveal>
        ))}
      </div>

      <div className="grid g2">
        <Reveal variant="left">
          <Tilt strength={5}>
            <article className="card" style={{ height: "100%" }}>
              <h3>The problem</h3>
              <p className="muted small">
                Code gets written, but compiling it, reading the error, fixing and rebuilding — all manual. Copy,
                paste, wait, repeat. The slow loop is the product nobody asked for.
              </p>
            </article>
          </Tilt>
        </Reveal>
        <Reveal variant="right" delay={120}>
          <Tilt strength={5}>
            <article className="card" style={{ height: "100%" }}>
              <h3>The solution</h3>
              <p className="muted small">
                Send a request — or let your agent call <code>compile</code>. The cloud runner builds for real and{" "}
                <code>compile_fix</code> repairs failures itself, retrying until the build is green. The output lands
                back where you started.
              </p>
            </article>
          </Tilt>
        </Reveal>
      </div>

      <Reveal>
        <h3>The pipeline</h3>
        <div className="flow" style={{ margin: "26px 0 10px" }}>
          {[
            ["Request", "web or agent"],
            ["Queue", "dispatched"],
            ["Cloud build", "compile + fix"],
            ["Dashboard", "logs + result"],
          ].map(([t, s], i, arr) => (
            <div key={t} style={{ display: "contents" }}>
              <div className="fnode">
                <b>{t}</b>
                <span>{s}</span>
              </div>
              {i < arr.length - 1 && <div className="farrow" />}
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal>
        <h3>Who uses what</h3>
        <ul>
          <li>
            <strong>User:</strong> sign up → send requests in <Link href="/dashboard/tasks">/dashboard/tasks</Link> → watch
            live status and output. Earn extra coins in <Link href="/dashboard/earn">/dashboard/earn</Link>.
          </li>
          <li>
            <strong>Admin:</strong> manages the cloud backend, users, balances, requests and support from a protected
            area that stays invisible until an admin logs in.
          </li>
        </ul>
      </Reveal>

      <Reveal>
        <h3>Fair pricing by size</h3>
        <p>1 coin ≈ 4 characters. Bigger files cost more — held on request, finally charged on output size. 10,000 coins free to start.</p>
      </Reveal>

      <Reveal variant="scale">
        <div className="cta holo">
          <h2>Try it out</h2>
          <p>Free plan: 10,000 coins — no card required.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 20, flexWrap: "wrap" }}>
            <Link className="btn btn-lg" href="/signup">
              Start free
            </Link>
            <Link className="btn-ghost btn-lg" href="/game">
              Game Studio
            </Link>
            <Link className="btn-ghost btn-lg" href="/docs">
              Docs
            </Link>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
