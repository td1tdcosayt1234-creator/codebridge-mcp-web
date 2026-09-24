"use client";
import { useEffect, useRef, type PointerEvent as RPointerEvent, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  strength?: number;
  glare?: boolean;
};

/** 3D perspective tilt that follows the pointer, with an optional moving glare. */
export default function Tilt({ children, className = "", strength = 7, glare = true }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: RPointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty("--ry", `${((px - 0.5) * strength * 2).toFixed(2)}deg`);
    el.style.setProperty("--rx", `${((0.5 - py) * strength * 2).toFixed(2)}deg`);
    el.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
    el.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--mx", "50%");
    el.style.setProperty("--my", "0%");
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("tilt-off");
    }
  }, []);

  return (
    <div
      ref={ref}
      className={`tilt ${glare ? "tilt-glare" : ""} ${className}`}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      {children}
    </div>
  );
}
