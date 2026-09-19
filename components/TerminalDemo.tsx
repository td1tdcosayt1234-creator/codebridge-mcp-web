"use client";
import { useEffect, useRef, useState } from "react";

type Line = { t: string; c: string };
const SCRIPT: Line[] = [
  { t: "$ codebridge run --task task_8f3k2q", c: "l-cmd" },
  { t: "✓ task queued — 214 coins held", c: "l-ok" },
  { t: "→ runner picked up job (ubuntu-latest)", c: "l-dim" },
  { t: "$ python -m compileall app.py", c: "l-cmd" },
  { t: "✗ SyntaxError line 42 — unexpected indent", c: "l-bad" },
  { t: "✦ AI fix engaged — reading error context…", c: "l-ai" },
  { t: "✓ patched app.py (attempt 1/3)", c: "l-ok" },
  { t: "$ python -m compileall app.py", c: "l-cmd" },
  { t: "✓ build passed in 8.4s", c: "l-ok" },
  { t: "→ result posted to dashboard (+38 coins)", c: "l-warn" },
  { t: "★ DONE — output ready for you", c: "l-ai" },
];

export default function TerminalDemo() {
  const [n, setN] = useState(3);
  const bodyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const id = setInterval(() => { setN((v) => (v >= SCRIPT.length ? 2 : v + 1)); }, 800);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [n]);
  return (
    <div className="term">
      <div className="term-bar"><i /><i /><i /><span className="term-title">codebridge — live build</span></div>
      <div className="term-body" ref={bodyRef}>
        {SCRIPT.slice(0, n).map((l, i) => (<div key={i} className={l.c}>{l.t}</div>))}
        <span className="cursor" />
      </div>
    </div>
  );
}
