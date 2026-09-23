import { redirect } from "next/navigation";

// Deprecated alias: /dev moved to /game (login required). Preserve ?prompt= links.
export default function DevRedirect({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const raw = searchParams?.prompt;
  const p = Array.isArray(raw) ? raw[0] : raw;
  redirect(p ? "/game?prompt=" + encodeURIComponent(p) : "/game");
}
