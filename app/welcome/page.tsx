"use client";
import { useEffect, useState } from "react";
import ProfileSurvey from "../../components/ProfileSurvey";

// Post-login onboarding gate: unfinished surveys land here (fresh Google
// users, password logins). Done/skipped -> dashboard (or /admin).
export default function Welcome() {
  const [checking, setChecking] = useState(true);
  const [role, setRole] = useState("user");

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((x) => x.json())
      .then((j) => {
        if (!j?.user) { window.location.href = "/login"; return; }
        setRole(j.user.role || "user");
        fetch("/api/auth/profile", { cache: "no-store" })
          .then((x) => x.json())
          .then((p) => {
            if (p?.profile?.surveyDone) {
              window.location.href = j.user.role === "admin" ? "/admin" : "/dashboard";
            } else setChecking(false);
          })
          .catch(() => setChecking(false));
      })
      .catch(() => { window.location.href = "/login"; });
  }, []);

  if (checking) {
    return (
      <div className="auth-wrap fade-up">
        <div className="card auth-card">
          <p className="muted small">Preparing your space…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrap fade-up">
      <div className="card auth-card">
        <ProfileSurvey onDone={() => { window.location.href = role === "admin" ? "/admin" : "/dashboard"; }} />
      </div>
    </div>
  );
}
