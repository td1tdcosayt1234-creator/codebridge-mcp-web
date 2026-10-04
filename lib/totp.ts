import crypto from "crypto";

// TOTP (RFC 6238, SHA-1, 30s, 6 digits) — zero dependencies.
// Secrets are random 20 bytes, base32-encoded. Stored in DB encrypted with
// TOKEN_ENC_KEY (lib/crypto encToken), so a DB leak alone cannot mint codes.

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function randomSecret(): string {
  return base32Encode(crypto.randomBytes(20));
}

export function base32Encode(buf: Buffer): string {
  let out = "";
  let bits = 0;
  let val = 0;
  for (let i = 0; i < buf.length; i++) {
    val = (val << 8) | buf[i];
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      out += B32[(val >>> bits) & 31];
    }
  }
  if (bits > 0) out += B32[(val << (5 - bits)) & 31];
  return out;
}

export function base32Decode(s: string): Buffer {
  const clean = s.trim().replace(/=+$/, "").toUpperCase();
  let bits = 0;
  let val = 0;
  const bytes: number[] = [];
  for (let i = 0; i < clean.length; i++) {
    const idx = B32.indexOf(clean[i]);
    if (idx < 0) throw new Error("bad base32");
    val = (val << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((val >>> bits) & 255);
    }
  }
  return Buffer.from(bytes);
}

function hotp(secret: Buffer, counter: number): string {
  const msg = Buffer.alloc(8);
  // 64-bit big-endian counter via number arithmetic (safe: counter < 2^53).
  const hi = Math.floor(counter / 4294967296);
  const lo = counter >>> 0;
  msg.writeUInt32BE(hi, 0);
  msg.writeUInt32BE(lo, 4);
  const h = crypto.createHmac("sha1", secret).update(msg).digest();
  const o = h[h.length - 1] & 15;
  const code = ((h[o] & 127) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(code % 1000000).padStart(6, "0");
}

export function totpNow(secretB32: string, atMs = Date.now()): string {
  const key = base32Decode(secretB32);
  const counter = Math.floor(atMs / 30000);
  return hotp(key, counter);
}

// Accept current ±1 step (clock skew). Constant-shape: always compares 3 codes.
export function totpVerify(secretB32: string, code: string, atMs = Date.now()): boolean {
  const c = String(code || "").replace(/\s/g, "");
  if (!/^\d{6}$/.test(c)) return false;
  let key: Buffer;
  try {
    key = base32Decode(secretB32);
  } catch {
    return false;
  }
  if (key.length < 10) return false;
  const t = Math.floor(atMs / 30000);
  const steps = [-1, 0, 1];
  let ok = false;
  for (let i = 0; i < steps.length; i++) {
    const want = hotp(key, t + steps[i]);
    if (want.length === c.length && crypto.timingSafeEqual(Buffer.from(want), Buffer.from(c))) ok = true;
  }
  return ok;
}

export function otpauthUrl(secretB32: string, email: string, issuer = "CodeBridge"): string {
  return (
    "otpauth://totp/" +
    encodeURIComponent(issuer + ":" + email) +
    "?secret=" + encodeURIComponent(secretB32) +
    "&issuer=" + encodeURIComponent(issuer) +
    "&algorithm=SHA1&digits=6&period=30"
  );
}

// Backup codes: 10 × 8-char, sha256-hashed at rest, single-use.
export function newBackupCodes(): { plain: string[]; hashes: string[] } {
  const plain: string[] = [];
  for (let i = 0; i < 10; i++) plain.push(crypto.randomBytes(5).toString("hex").slice(0, 8).toUpperCase());
  const hashes = plain.map((c) => crypto.createHash("sha256").update("cb2fa$" + c).digest("hex"));
  return { plain, hashes };
}

export function backupMatches(hash: string, code: string): boolean {
  const c = String(code || "").trim().toUpperCase();
  if (!/^[A-F0-9]{8}$/.test(c)) return false;
  const h = crypto.createHash("sha256").update("cb2fa$" + c).digest("hex");
  if (h.length !== hash.length) return false;
  return crypto.timingSafeEqual(Buffer.from(h), Buffer.from(hash));
}
