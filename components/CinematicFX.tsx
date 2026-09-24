"use client";
import { useEffect, useRef } from "react";

/**
 * Cinematic runtime layer:
 *  - top scroll progress bar
 *  - desktop cursor spotlight
 *  - shared pointer spotlight for every .btn / .btn-ghost / .card / .holo
 */
export default function CinematicFX() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    /* ---- scroll progress + nav state ---- */
    const bar = document.querySelector<HTMLElement>(".scroll-progress");
    const nav = document.querySelector<HTMLElement>(".nav");
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
        if (bar) bar.style.setProperty("--sweep", `${(p * 100).toFixed(2)}%`);
        nav?.classList.toggle("scrolled", window.scrollY > 12);
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    /* ---- pointer layers ---- */
    if (reduced || !fine) {
      return () => {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      };
    }

    const glow = glowRef.current;
    let gx = window.innerWidth / 2;
    let gy = window.innerHeight / 2;
    let cx = gx;
    let cy = gy;
    let raf = 0;

    const loop = () => {
      cx += (gx - cx) * 0.12;
      cy += (gy - cy) * 0.12;
      if (glow) glow.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onMove = (e: PointerEvent) => {
      gx = e.clientX;
      gy = e.clientY;
      glow?.classList.add("on");

      const target = (e.target as HTMLElement | null)?.closest<HTMLElement>(
        ".btn, .btn-ghost, .card, .holo",
      );
      document.querySelectorAll<HTMLElement>(".spot-lit").forEach((el) => {
        el.classList.remove("spot-lit");
      });
      if (target) {
        const r = target.getBoundingClientRect();
        target.style.setProperty("--mx", `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
        target.style.setProperty("--my", `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
        target.classList.add("spot-lit");
      }
    };

    const onLeave = () => {
      glow?.classList.remove("on");
      document.querySelectorAll<HTMLElement>(".spot-lit").forEach((el) => el.classList.remove("spot-lit"));
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div className="scroll-progress" aria-hidden="true" />
      <div className="cursor-glow" ref={glowRef} aria-hidden="true" />
    </>
  );
}
