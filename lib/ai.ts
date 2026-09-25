import { readDb } from "./db";
import { decToken } from "./crypto";

export const ZEN_DEFAULT_BASE = "https://opencode.ai/zen/v1";
export const ZEN_DEFAULT_MODEL = "gpt-5.4-mini";

export type ZenCfg = { key: string; base: string; model: string; source: "admin" | "env" };

// Effective AI config: admin-panel key wins, .env is fallback. No restart needed.
export async function zenConfig(): Promise<ZenCfg> {
  try {
    const db = await readDb();
    if (db.globalAI?.enc) {
      const k = decToken(db.globalAI.enc);
      if (k) {
        return {
          key: k,
          base: (db.globalAI.baseUrl || process.env.OPENCODE_BASE_URL || ZEN_DEFAULT_BASE).replace(/\/+$/, ""),
          model: db.globalAI.model || process.env.OPENCODE_MODEL || ZEN_DEFAULT_MODEL,
          source: "admin",
        };
      }
    }
  } catch {
    /* fall through to env */
  }
  return {
    key: (process.env.OPENCODE_API_KEY || "").trim(),
    base: (process.env.OPENCODE_BASE_URL || ZEN_DEFAULT_BASE).replace(/\/+$/, ""),
    model: process.env.OPENCODE_MODEL || ZEN_DEFAULT_MODEL,
    source: "env",
  };
}

export function zenKeyOk(key: string): boolean {
  return key.trim().length > 10;
}
