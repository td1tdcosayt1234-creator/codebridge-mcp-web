import type { ReactNode } from "react";

type Props = {
  kicker: string;
  title: ReactNode;
  sub?: ReactNode;
  center?: boolean;
  children?: ReactNode;
};

/** Shared cinematic header for every inner page. */
export default function PageHero({ kicker, title, sub, center = true, children }: Props) {
  return (
    <header className={`page-hero fade-up${center ? " center" : ""}`}>
      <span className="hero-aurora" aria-hidden="true" />
      <div className="kicker">
        <span className="pulse-dot" />
        {kicker}
      </div>
      <h1>{title}</h1>
      {sub && <p>{sub}</p>}
      {children}
    </header>
  );
}
