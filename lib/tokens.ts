// Token economy: file joto boro, compile/fix e toto token.
// 1 token ~= 4 chars. Compile charge = prompt + files. Fix charge = output log + result size.
export const TOKEN_PER_CHAR = 1 / 4;
export const FREE_BALANCE = 10000;
export const MAX_FILES_BYTES = 200 * 1024;

export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil((text || "").length / 4));
}

export function filesBytes(files: { path: string; content: string }[]): number {
  return files.reduce((n, f) => n + (f.content || "").length + (f.path || "").length, 0);
}

export function estimateTask(prompt: string, files: { path: string; content: string }[]): number {
  const filesText = files.map((f) => f.path + "\n" + f.content).join("\n");
  return estimateTokens(prompt) + estimateTokens(filesText);
}

export function estimateResult(log: string, result: string): number {
  return estimateTokens(log) + estimateTokens(result);
}
