"use client";
import { useEffect, useState } from "react";

type Line = { t: string; c: string };

const SCRIPT: Line[] = [
  { t: "$ codebridge compile app.py", c: "l-cmd" },
  { t: "✓ task queued — 214 coins held", c: "l-ok" },
  { t: "→ runner started on ubuntu-latest", c: "l-dim" },
  { t: "$ python -m compileall app.py", c: "l-cmd" },
  { t: "✗ SyntaxError line 42 — unexpected indent", c: "l-bad" },
  { t: "✦ AI fix engaged — reading error context…", c: "l-ai" },
  { t: "✓ patched app.py (attempt 1/3)", c: "l-ok" },
  { t: "$ python -m compileall app.py", c: "l-cmd" },
  { t: "✓ build passed in 8.4s", c: "l-ok" },
  { t: "→ result posted to dashboard (+38 coins)", c: "l-warn" },
  { t: "★ DONE — output ready", c: "l-ai" },
];

export default function TerminalDemo() {
  const [n, setN] = useState(2);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(SCRIPT.length);
      return;
    }
    const id = setInterval(() => setN((v) => (v >= SCRIPT.length ? 2 : v + 1)), 900);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="term float-slow"
      role="img"
      aria-label="CodeBridge build log: a compile request is queued, fails, is repaired by AI and passes"
    >
      <div className="term-bar">
        <i />
        <i />
        <i />
        <span className="term-title">codebridge — live build</span>
        <span className="term-live">
          <span className="pulse-dot" />
          streaming
        </span>
      </div>
      <div className="term-body">
        {SCRIPT.slice(0, n).map((l, i) => (
          <div key={i} className={l.c}>
            {l.t}
          </div>
        ))}
        <span className="cursor" />
      </div>
      <div className="term-foot">
        <span>task_8f3k2q</span>
        <span className="term-bar-progress">
          <i />
        </span>
        <span>runner-07</span>
      </div>
    </div>
  );
}
