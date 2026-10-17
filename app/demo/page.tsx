import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "../../components/PageHero";
import Reveal from "../../components/Reveal";

export const metadata: Metadata = {
  title: "Demo",
  description:
    "Roun in action: a real build timeline, the verifiable build pipeline, and what Game Studio actually produces.",
};

const SAMPLE_LOG = `Queued (compile, ~158 tokens held). Dispatching the Roun cloud runner...

Dispatched to <builder-org>/<builder-repo> (opencode-task.yml).
Runner picked up the task → status: running
Detected project type: python  →  toolchain: Python 3.12

[attempt 1] python app.py
  exit code: 0
  output:
    Merge sort demo: [1, 2, 3, 7, 11, 23, 42, 99]
    All assertions passed (6/6)

status: done  ·  charged: 158 coins (final charge cap = 3x estimate + 500)`;

const TYPES = [
  "android", "minecraft", "flutter", "node", "python", "go", "rust", "java",
  "dotnet", "php", "ruby", "cpp", "web", "deno", "bun", "minecraft-datapack",
];

const STEPS = [
  ["Install opencode", "the AI coding agent CLI, on the fresh VM"],
  ["Pull task from web", "authenticated download of ONLY your request (runner token + per-task nonce)"],
  ["Write task files", "into an isolated task-work/ dir, paths sanitized, junk + binaries filtered"],
  ["Run opencode", "the agent builds/compiles your project; fix-compile mode retries up to 3x"],
  ["Real build", "type auto-detect → matching toolchain (Gradle/JDK17/Android SDK/Go/Py…)"],
  ["Send result to web", "log + result + artifact (APK/JAR when applicable) back to your dashboard"],
];

export default function Demo() {
  return (
    <div className="prose">
      <PageHero
        kicker="Real examples"
        title={<>See it <span className="grad-anim">working</span></>}
        sub="Everything on this page is pulled from the live pipeline — the same strings, formats and limits the service actually uses."
      />

      <Reveal variant="left">
        <h3>1 · A request, the way it moves</h3>
        <p>
          Every request (web or agent call) walks the same four real states — <code>queued → running → done/failed</code>
          — and the dashboard log below is the exact format the pipeline writes (content anonymized):
        </p>
        <div className="codeblock">
          <div className="codeblock-bar">
            <span>dashboard · task log · sample</span>
            <span className="muted small">queued → running → done</span>
          </div>
          <pre>{SAMPLE_LOG}</pre>
        </div>
        <p className="muted small">
          Agent calls (MCP) return within ~90 seconds with the task id, then <code>get_task_result</code> streams the
          live log directly into your agent — no dashboard visit needed (block up to ~8 minutes for long Gradle
          builds).
        </p>
      </Reveal>

      <Reveal variant="left" delay={50}>
        <h3>2 · The builder, publicly verifiable</h3>
        <p>
          Your build never runs on our login servers: it runs on a fresh GitHub Actions VM, driven by a public,
          inspectable pipeline. These are the actual workflow steps, straight from the repo:
        </p>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="table-wrap" style={{ border: 0 }}>
            <table className="tools">
              <thead>
                <tr><th>Step</th><th>What it really does</th></tr>
              </thead>
              <tbody>
                {STEPS.map(([n, w]) => (
                  <tr key={n}>
                    <td><code>{n}</code></td>
                    <td>{w}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="muted small">
          Source:&nbsp;
          <a href="https://github.com/td1tdcosayt1234-creator/codebridge-mcp-web/blob/main/.github/workflows/opencode-task.yml" target="_blank" rel="noopener noreferrer">
            opencode-task.yml
          </a>{" "}
          · and the platform&rsquo;s own production deploy builds on the same runners —
          <a href="https://github.com/td1tdcosayt1234-creator/codebridge-mcp-web/actions/runs/38949451413" target="_blank" rel="noopener noreferrer">
            view a real public run log
          </a>.
        </p>
      </Reveal>

      <Reveal variant="left" delay={50}>
        <h3>3 · What it understands out of the box</h3>
        <p>
          The dispatcher auto-detects your project from the files you attach (this is the real detector, not a
          marketing list):
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {TYPES.map((t) => (
            <span key={t} className="chip"><code>{t}</code></span>
          ))}
        </div>
        <p className="muted small" style={{ marginTop: 10 }}>
          Prompt-only requests work too — no files required. Caps: 50 files / 200 KB total / ~100 KB per file.
        </p>
      </Reveal>

      <Reveal variant="left" delay={50}>
        <h3>4 · Game Studio — describe, play, keep</h3>
        <p>
          Game Studio takes a short prompt (≤ 500 characters), plans it, and code-generates a playable
          <strong> single-file HTML5 game</strong> that runs in the browser — no build step, nothing to install.
          Behind the scenes it rotates 5 coding models branded &ldquo;Roun Co Pilot&rdquo; (North Mini Code, Laguna
          Coder, Laguna Fast, Nemotron Super, Gemma 31B), showing plan → coding stages live while it works.
        </p>
        <ul className="check">
          <li>Type &ldquo;neon snake with combo scoring&rdquo; — get a playable game in seconds.</li>
          <li>Every generation is saved to <Link href="/game/history">Game History</Link> — replay any past game.</li>
          <li>The file is yours: download it and it keeps running offline.</li>
        </ul>
        <p><Link className="btn" href="/game">Open Game Studio (free account)</Link></p>
      </Reveal>

      <Reveal variant="left" delay={50}>
        <h3>5 · Numbers, exactly as the platform enforces</h3>
        <ul>
          <li><strong>6</strong> agent tools on the MCP layer (compile, compile_fix, list_tasks, get_task_result, gh_issue_list, auth_check).</li>
          <li><strong>10,000</strong> free coins on signup; earn more by watching ads (+50, max 10/day).</li>
          <li>Fix-compile retry cap: <strong>3</strong> automatic AI repairs per failed build.</li>
          <li>Charge integrity: final charge never exceeds <strong>3× the estimate + 500</strong>.</li>
          <li>Dispatch failure ⇒ coins held are <strong>auto-refunded in full</strong>.</li>
        </ul>
      </Reveal>
    </div>
  );
}
