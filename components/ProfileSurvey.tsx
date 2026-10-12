"use client";
import { useState } from "react";
import { GENDERS, HEAR_ABOUT, GOALS } from "../lib/profile";

// Onboarding quick survey — ONE question per screen with progress + stagger.
// Props: onDone() -> next step. Skip allowed — account is active.
const STEPS = [
  { key: "gender", title: "You are…", sub: "Step 1 of 3 — helps us personalise your space." },
  { key: "hearAbout", title: "How did you find us?", sub: "Step 2 of 3 — tell us where you heard about Roun." },
  { key: "goal", title: "What brings you here?", sub: "Step 3 of 3 — we will highlight the right tools." },
] as const;

const GENDER_MONO = ["M", "F", "O", "–"];

function cardStyle(selected: boolean): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: 12,
    width: "100%",
    textAlign: "left",
    padding: "13px 15px",
    borderRadius: 14,
    cursor: "pointer",
    border: selected ? "1px solid var(--mint)" : "1px solid var(--line-2)",
    background: selected
      ? "linear-gradient(135deg, rgba(45,212,191,0.16), rgba(139,92,246,0.14))"
      : "rgba(255,255,255,0.03)",
    boxShadow: selected ? "0 0 26px -10px rgba(45,212,191,0.7)" : "none",
    transform: selected ? "scale(1.015)" : "none",
    transition: "all .22s var(--ease, ease)",
    color: "inherit",
    font: "inherit",
  };
}

function monoStyle(selected: boolean): React.CSSProperties {
  return {
    width: 40,
    height: 40,
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    fontWeight: 800,
    fontSize: 16,
    color: "#fff",
    background: selected
      ? "linear-gradient(135deg, var(--mint), var(--violet))"
      : "linear-gradient(135deg, rgba(139,92,246,.55), rgba(45,212,191,.45))",
    boxShadow: selected ? "0 0 18px -4px rgba(45,212,191,.9)" : "none",
  };
}

function dotStyle(selected: boolean): React.CSSProperties {
  return { ...monoStyle(selected), width: 14, height: 14, fontSize: 0 };
}

export default function ProfileSurvey({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [gender, setGender] = useState("");
  const [hearAbout, setHearAbout] = useState("");
  const [goal, setGoal] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(0);

  const picked = step === 0 ? gender : step === 1 ? hearAbout : goal;

  function pick(setter: (v: string) => void) {
    return (v: string) => { if (!busy) { setter(v); setErr(""); } };
  }
  const pickGender = pick(setGender);
  const pickHear = pick(setHearAbout);
  const pickGoal = pick(setGoal);

  function next() {
    if (busy) return;
    setErr("");
    if (!picked) {
      setErr("Please pick an option to continue.");
      setShake((s) => s + 1);
      return;
    }
    if (step < 2) setStep(step + 1);
    else finish();
  }

  async function finish() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gender, hearAbout, goal }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.status === 401) { window.location.href = "/login"; return; }
      if (!res.ok) {
        setErr(j.error || "Could not save — try again.");
        setShake((s) => s + 1);
        return;
      }
      onDone();
    } catch {
      setErr("Server unreachable — try again.");
      setShake((s) => s + 1);
    } finally {
      setBusy(false);
    }
  }

  function skip() {
    if (busy) return;
    onDone();
  }

  return (
    <div key={shake} className={err ? " shake" : ""}>
      <div className="kicker">
        <span className="pulse-dot" />
        Almost done
      </div>
      <h1>
        Quick <span className="grad-anim">survey</span>
      </h1>

      {/* progress */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "6px 0 4px" }}>
        <div role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={3} aria-label="Survey progress" className="progress-shimmer" style={{ flex: 1, height: 7, borderRadius: 99, background: "rgba(255,255,255,.08)", overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${((step + 1) / 3) * 100}%`,
              borderRadius: 99,
              background: "linear-gradient(90deg, var(--mint), var(--violet))",
              boxShadow: "0 0 14px -2px rgba(45,212,191,.8)",
              transition: "width .35s var(--ease, ease)",
            }}
          />
        </div>
        <span className="muted small" style={{ whiteSpace: "nowrap" }} aria-hidden="true">{step + 1} / 3</span>
      </div>

      <div key={step} className="fade-up">
        <p className="muted small" style={{ margin: "10px 0 4px" }}>{STEPS[step].sub}</p>
        <h2 style={{ margin: "0 0 14px", fontSize: 21 }}>
          <span className="word-mask"><span>{STEPS[step].title}</span></span>
        </h2>

        {step === 0 && (
          <div className="opt-grid-2 stagger" role="radiogroup" aria-label="Gender">
            {GENDERS.map((g, i) => (
              <button key={g.value} type="button" role="radio" aria-checked={gender === g.value} onClick={() => pickGender(g.value)} style={{ ...cardStyle(gender === g.value), flexDirection: "column", gap: 8, padding: "16px 10px", textAlign: "center", alignItems: "center" }}>
                <span aria-hidden="true" style={monoStyle(gender === g.value)}>{GENDER_MONO[i]}</span>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{g.label}</span>
              </button>
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="stagger" role="radiogroup" aria-label="How you heard about us" style={{ display: "grid", gap: 10 }}>
            {HEAR_ABOUT.map((h) => (
              <button key={h.value} type="button" role="radio" aria-checked={hearAbout === h.value} onClick={() => pickHear(h.value)} style={cardStyle(hearAbout === h.value)}>
                <span aria-hidden="true" style={dotStyle(hearAbout === h.value)} />
                <span style={{ fontWeight: 600 }}>{h.label}</span>
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="stagger" role="radiogroup" aria-label="Your main goal" style={{ display: "grid", gap: 10 }}>
            {GOALS.map((g) => (
              <button key={g.value} type="button" role="radio" aria-checked={goal === g.value} onClick={() => pickGoal(g.value)} style={cardStyle(goal === g.value)}>
                <span aria-hidden="true" style={dotStyle(goal === g.value)} />
                <span>
                  <span style={{ display: "block", fontWeight: 700 }}>{g.label}</span>
                  <span className="muted small" style={{ display: "block", marginTop: 2 }}>{g.hint}</span>
                </span>
              </button>
            ))}
          </div>
        )}

        {err && (
          <p className="small" style={{ marginTop: 12 }} role="alert">
            <span className="badge bad">{err}</span>
          </p>
        )}

        <div className="survey-nav">
          {step > 0 && (
            <button type="button" className="btn btn-lg" style={{ flex: "0 0 auto", paddingLeft: 18, paddingRight: 18 }} onClick={() => { if (!busy) { setStep(step - 1); setErr(""); } }} disabled={busy}>
              ← Back
            </button>
          )}
          <button type="button" className={"btn btn-lg shine" + (busy && step === 2 ? " is-loading" : "")} style={{ flex: 1 }} onClick={next} disabled={busy}>
            {busy ? "Saving…" : step === 2 ? "Finish & continue" : "Continue →"}
          </button>
        </div>
      </div>

      <p className="muted small" style={{ margin: "14px 0 0", textAlign: "center" }}>
        <button type="button" className="pw-toggle" style={{ position: "static", transform: "none" }} onClick={skip} disabled={busy}>
          Skip for now →
        </button>
      </p>
    </div>
  );
}
