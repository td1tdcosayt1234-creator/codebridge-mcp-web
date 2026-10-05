import Link from "next/link";
import PageHero from "../../../components/PageHero";
import Reveal from "../../../components/Reveal";

export default function GameDocs() {
  return (
    <div className="prose">
      <PageHero
        kicker="Game Studio"
        title={<>Docs — <span className="grad-anim">plan → build → history</span></>}
        sub="Chat in plain language, AI plans first, then builds a real single-file HTML5 game. Every build is saved to history."
      />

      <Reveal variant="left">
        <h3>1 — Plan before you build</h3>
        <p>
          In <Link href="/game">/game</Link>, describe your idea and press <strong>📋 Plan first</strong>.
          The AI returns a short plan: title, goal, controls (keyboard + touch), features and build steps.
          Check it, then press <strong>✅ Confirm & Build</strong>.
        </p>
        <ul className="check">
          <li>Plan uses your custom endpoint (<code>hl</code> on <code>localhost:20128/v1</code>) when configured.</li>
          <li>Plans are free to regenerate — 10 plans/min per user.</li>
          <li>Direct API: <code>POST /api/game/plan</code> with <code>{"{prompt, model?}"}</code>.</li>
        </ul>
      </Reveal>

      <Reveal variant="left" delay={50}>
        <h3>2 — Build & live preview</h3>
        <p>
          Every chat message rebuilds the full game from the whole conversation — preview updates live on the right.
          Keyboard (arrows / WASD / space) and touch both work. Download gives you one standalone HTML file.
        </p>
        <ul className="check">
          <li>Provider order in Auto: <strong>custom (hl) → opencode → kilo</strong>.</li>
          <li>Model picker: <strong>Custom (localhost:20128)</strong> group shows <code>hl ★</code>.</li>
          <li>After completion the AI itself writes the chat summary (no hardcoded text).</li>
          <li>Cloudflare Tunnel kills requests over ~100s, so builds run as async jobs with polling.</li>
        </ul>
      </Reveal>

      <Reveal variant="left" delay={50}>
        <h3>3 — History</h3>
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

      <Reveal variant="left" delay={50}>
        <h3>Models & endpoint</h3>
        <p>
          Default custom model is <code>hl</code> (9router combo, currently served by Muse Spark).
          Configure in <code>.env</code> — no code change needed:
        </p>
        <div className="codeblock">
          <pre>OPENCODE_API_KEY=sk-...{"\n"}OPENCODE_BASE_URL=http://localhost:20128/v1{"\n"}OPENCODE_MODEL=hl</pre>
        </div>
        <p className="muted small">
          Admins can also set it from <Link href="/admin/ai">/admin/ai</Link> (takes effect immediately, no restart).
          Small prompts answer instantly; full game files take 1–3 minutes.
        </p>
      </Reveal>

      <Reveal variant="scale">
        <div className="cta holo">
          <h2>Start building</h2>
          <p>Plan first, then build — history keeps everything.</p>
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
