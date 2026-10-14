import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Game Studio Docs",
  description: "How Game Studio works: Roun Co Pilot plans and builds real single-file HTML5 games with live real-time progress.",
};
import PageHero from "../../../components/PageHero";
import Reveal from "../../../components/Reveal";

export default function GameDocs() {
  return (
    <div className="prose">
      <PageHero
        kicker="Game Studio · Roun Co Pilot"
        title={<>Docs — <span className="grad-anim">plan → build → play</span></>}
        sub="Describe a game in plain words. Roun Co Pilot (free OpenRouter models) plans it, writes the full code live in front of you, and hands over a playable single-file HTML5 game. Every build auto-saves to history."
      />

      <Reveal variant="left">
        <h3>1 — Plan before you build</h3>
        <p>
          In <Link href="/game">/game</Link>, describe your idea and press <strong>📋 Plan first</strong>.
          Roun Co Pilot returns a short plan: title, goal, controls (keyboard + touch), features and
          build steps. Check it, then press <strong>✅ Confirm & Build</strong>.
        </p>
        <ul className="check">
          <li>Planner runs on <strong>Roun Co Pilot</strong> free models — no key needed from you.</li>
          <li>Plans are free to regenerate — 10 plans/min per user.</li>
          <li>Direct API: <code>POST /api/game/plan</code> with <code>{"{prompt, model?}"}</code>.</li>
        </ul>
      </Reveal>

      <Reveal variant="left" delay={50}>
        <h3>2 — Build with live real-time stages</h3>
        <p>
          No fake progress bar. While your game builds, the preview shows the{" "}
          <strong>real pipeline stage straight from the server</strong> — the second it changes:
        </p>
        <ul className="check">
          <li>📋 <strong>Preparing</strong> — your idea is queued and shaped into a build spec.</li>
          <li>💻 <strong>Coding · model name · try n/m</strong> — the actual free model writing your game code right now. If one is busy, rotation moves to the next and you see it switch live.</li>
          <li>✨ <strong>Finalizing</strong> — code passed checks, summary is being written.</li>
          <li>✅ <strong>Done</strong> — live preview updates, chat gets an AI-written summary.</li>
        </ul>
        <p className="muted small">
          Every chat message rebuilds the full game from the whole conversation — preview updates live.
          Keyboard (arrows / WASD / space) and touch both work. Cloudflare Tunnel kills requests over
          ~100s, so builds run as async jobs with polling (<code>POST /api/game/generate</code> →{" "}
          <code>GET /api/game/generate?job=id</code> every 3s).
        </p>
      </Reveal>

      <Reveal variant="left" delay={50}>
        <h3>3 — Roun Co Pilot models (all free)</h3>
        <p>
          One dropdown, zero config. <strong>Auto</strong> rotates all five free models for best
          availability; picking one pins the build to that model only.
        </p>
        <ul className="check">
          <li><strong>North Mini Code</strong> — code specialist, default pick.</li>
          <li><strong>Laguna Coder / Laguna Fast</strong> — code models, fast variant for quick drafts.</li>
          <li><strong>Nemotron Super</strong> — biggest brain for complex games.</li>
          <li><strong>Gemma 31B</strong> — balanced all-rounder.</li>
        </ul>
        <div className="codeblock">
          <pre>OPENROUTER_API_KEY=sk-or-v1-...{"\n"}# server: https://openrouter.ai/api/v1 (free :free models only)</pre>
        </div>
        <p className="muted small">
          Server allow-list blocks everything outside the free set — the key can never be spent on paid
          models. Full game files take 1–3 minutes depending on model load.
        </p>
      </Reveal>

      <Reveal variant="left" delay={50}>
        <h3>4 — History</h3>
        <p>
          Every finished game auto-saves. Open the <strong>🕘 History</strong> toggle inside{" "}
          <Link href="/game">/game</Link> or the full page <Link href="/game/history">/game/history</Link>:
          reload any build into the preview, delete one, or clear all. Server history needs login;
          recent builds also stay in your browser (localStorage) as fallback.
        </p>
        <ul className="check">
          <li><code>GET /api/game/history</code> — list mine (latest 100).</li>
          <li><code>GET /api/game/history?id=xxx</code> — load one (full HTML).</li>
          <li><code>POST /api/game/history</code> — save <code>{"{prompt, plan, provider, model, html, summary}"}</code>.</li>
          <li><code>DELETE /api/game/history?id=xxx</code> or <code>?all=1</code>.</li>
        </ul>
      </Reveal>

      <Reveal variant="scale">
        <div className="cta holo">
          <h2>Start building</h2>
          <p>Plan first, watch it code live, then play — history keeps everything.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 20, flexWrap: "wrap" }}>
            <Link className="btn btn-lg" href="/game">Open Game Studio</Link>
            <Link className="btn-ghost btn-lg" href="/game/history">History</Link>
            <Link className="btn-ghost btn-lg" href="/about">About</Link>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
