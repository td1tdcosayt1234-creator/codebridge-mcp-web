// Firebase Realtime Database adapter — single-doc shared store.
//
// Why RTDB (not a local file): data/db.json lives on ONE machine. A second
// origin (GitHub Actions 6h host, new VPS, ...) starts with an EMPTY db —
// users, balances, tasks diverge (split-brain). With Firebase set, every
// origin reads/writes the SAME JSON doc, so all data stays saved.
//
// Enabled ONLY when env is set, otherwise lib/db.ts uses the local file
// exactly as before (zero behaviour change for existing setups).
//
//   FIREBASE_DATABASE_URL=https://<project>-default-rtdb.firebaseio.com
//   FIREBASE_SERVICE_ACCOUNT=<full service-account JSON string>
//     OR the 3-part form:
//   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL,
//   FIREBASE_PRIVATE_KEY (\\n-escaped PEM)
//
// Optional: FIREBASE_DB_PATH (default "codebridge/maindb").
// Security: with DB_MASTER_KEY set, the payload uploaded is the AES-GCM
// envelope — Firebase only ever sees ciphertext.

export function remoteEnabled(): boolean {
  if (!((process.env.FIREBASE_DATABASE_URL || "").trim())) return false;
  if (((process.env.FIREBASE_SERVICE_ACCOUNT || "").trim())) return true;
  return !!(
    (process.env.FIREBASE_PROJECT_ID || "").trim() &&
    (process.env.FIREBASE_CLIENT_EMAIL || "").trim() &&
    (process.env.FIREBASE_PRIVATE_KEY || "").trim()
  );
}

function dbPath(): string {
  return (process.env.FIREBASE_DB_PATH || "codebridge/maindb")
    .trim()
    .replace(/^\/+|\/+$/g, "") || "codebridge/maindb";
}

async function dbRef() {
  // firebase-admin v12+ modular API (no admin.apps / admin.database namespaces).
  const appMod: any = await import("firebase-admin");
  const admin: any = appMod.default || appMod;
  const getApps: () => any[] = admin.getApps?.bind(admin) || (() => []);
  if (!getApps().length) {
    const url = (process.env.FIREBASE_DATABASE_URL || "").trim();
    let cred: any;
    const full = (process.env.FIREBASE_SERVICE_ACCOUNT || "").trim();
    if (full) {
      cred = admin.cert(JSON.parse(full));
    } else {
      cred = admin.cert({
        projectId: (process.env.FIREBASE_PROJECT_ID || "").trim(),
        clientEmail: (process.env.FIREBASE_CLIENT_EMAIL || "").trim(),
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || "")
          .replace(/\\n/g, "\n")
          .trim(),
      });
    }
    admin.initializeApp({ credential: cred, databaseURL: url });
  }
  const app = admin.getApp();
  const dbMod: any = await import("firebase-admin/database");
  return dbMod.getDatabase(app).ref(dbPath());
}

// Returns the stored string (encrypted envelope or plaintext JSON), or null
// when nothing has been saved yet.
export async function remoteGet(): Promise<string | null> {
  const ref = await dbRef();
  const snap = await ref.get();
  if (!snap.exists()) return null;
  const v = snap.val();
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && typeof (v as any).payload === "string")
    return (v as any).payload;
  return JSON.stringify(v);
}

export async function remoteSet(payload: string): Promise<void> {
  const ref = await dbRef();
  // Plain string write keeps the node tiny and avoids RTDB key-sanitizing
  // issues with arbitrary JSON (".", "$", "#", "[", "]" in keys).
  await ref.set(payload);
}

export function remoteWhyDisabled(): string {
  if ((process.env.FIREBASE_DATABASE_URL || "").trim()) {
    return "missing service account (FIREBASE_SERVICE_ACCOUNT or PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY)";
  }
  return "FIREBASE_DATABASE_URL not set (local file mode)";
}

export function remoteStatus(): { enabled: boolean; path: string; reason: string } {
  const enabled = remoteEnabled();
  return {
    enabled,
    path: enabled ? dbPath() : "",
    reason: enabled ? "ok" : remoteWhyDisabled(),
  };
}
