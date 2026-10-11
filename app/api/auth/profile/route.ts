import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { readDb, writeDb, uid } from "@/lib/db";
import { rateLimit, clientIp, csrfCheck, csrfBlock } from "@/lib/security";
import { genderError, hearAboutError, goalError } from "@/lib/profile";

export const dynamic = "force-dynamic";

// Onboarding survey (after email verification — session cookie is set).
// POST {gender, hearAbout, goal} -> saved on the user. GET -> current profile.
export async function GET() {
  const t = cookies().get("session")?.value || "";
  const p = await verifyJwt(t);
  if (!p) return NextResponse.json({ error: "Login required." }, { status: 401 });
  const db = await readDb();
  const u = db.users.find((x) => x.id === p.sub);
  if (!u) return NextResponse.json({ error: "Account not found." }, { status: 404 });
  return NextResponse.json({
    ok: true,
    profile: {
      firstName: u.firstName || "", lastName: u.lastName || "", country: u.country || "",
      gender: u.gender || "", hearAbout: u.hearAbout || "", goal: u.goal || "", surveyAt: u.surveyAt || "",
      surveyDone: !!(u.gender && u.hearAbout && u.goal),
    },
  });
}

export async function POST(req: Request) {
  if (!csrfCheck(req)) return csrfBlock();
  const t = cookies().get("session")?.value || "";
  const p = await verifyJwt(t);
  if (!p) return NextResponse.json({ error: "Login required." }, { status: 401 });
  const ip = clientIp(req);
  const rl = rateLimit("profile:" + ip, 20, 60 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Too many tries. Try again later." }, { status: 429 });
  const body = await req.json().catch(() => ({}));
  const gender = String(body.gender || "").trim().slice(0, 30);
  const hearAbout = String(body.hearAbout || "").trim().slice(0, 30);
  const goal = String(body.goal || "").trim().slice(0, 30);
  const gErr = genderError(gender);
  if (gErr) return NextResponse.json({ error: gErr }, { status: 400 });
  const hErr = hearAboutError(hearAbout);
  if (hErr) return NextResponse.json({ error: hErr }, { status: 400 });
  const goErr = goalError(goal);
  if (goErr) return NextResponse.json({ error: goErr }, { status: 400 });
  const db = await readDb();
  const u = db.users.find((x) => x.id === p.sub);
  if (!u) return NextResponse.json({ error: "Account not found." }, { status: 404 });
  u.gender = gender;
  u.hearAbout = hearAbout;
  u.goal = goal;
  u.surveyAt = new Date().toISOString();
  db.events.push({ id: uid("e"), userId: u.id, action: "profile_survey", detail: `${gender} / ${hearAbout} / ${goal}`, at: u.surveyAt });
  await writeDb(db);
  return NextResponse.json({ ok: true });
}
