"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SideNav({ items }: { items: [string, string, string][] }) {
  const path = usePathname();
  return (
    <div className="side card">
      {items.map(([h, t, icon]) => (
        <Link key={h} href={h} className={path === h ? "active" : ""}>
          <span style={{ marginRight: 8 }}>{icon}</span>{t}
        </Link>
      ))}
    </div>
  );
}
