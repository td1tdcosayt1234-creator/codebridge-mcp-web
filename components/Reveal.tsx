"use client";
import { useEffect, useRef, type ReactNode } from "react";

export default function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { el.classList.add("rv-in"); return; }
    const io = new IntersectionObserver(
      (es) => { es.forEach((e) => { if (e.isIntersecting) { el.classList.add("rv-in"); io.disconnect(); } }); },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`rv ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</div>;
}
