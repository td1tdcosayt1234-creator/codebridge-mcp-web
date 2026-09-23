"use client";
import { useState } from "react";

export default function CopyBtn({ text, label = "Copy" }: { text: string; label?: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      className="copy-btn"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setOk(true);
          setTimeout(() => setOk(false), 1600);
        } catch { /* clipboard unavailable */ }
      }}
    >
      {ok ? "✓ Copied" : label}
    </button>
  );
}
