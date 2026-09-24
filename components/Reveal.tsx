"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";

type Variant = "up" | "left" | "right" | "scale" | "blur";

const CLASS: Record<Variant, string> = {
  up: "",
  left: "rv-left",
  right: "rv-right",
  scale: "rv-scale",
  blur: "rv-blur",
};

type Props = {
  children: ReactNode;
  delay?: number;
  className?: string;
  variant?: Variant;
  once?: boolean;
  amount?: number;
};

export default function Reveal({
  children,
  delay = 0,
  className = "",
  variant = "up",
  once = true,
  amount = 0.16,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShown(true);
            if (once) io.disconnect();
          } else if (!once) {
            setShown(false);
          }
        });
      },
      { threshold: amount, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [once, amount]);

  return (
    <div
      ref={ref}
      className={`rv ${CLASS[variant]} ${shown ? "rv-in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
