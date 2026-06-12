import { createHmac, createHash } from "crypto";

interface AuthCodePayload {
  client_id: string;
  redirect_uri: string;
  code_challenge: string;
  exp: number;
}

function secret(): string {
  const s = process.env.MCP_SECRET;
  if (!s) throw new Error("MCP_SECRET is not set");
  return s;
}

/** Create a signed, short-lived authorization code. */
export function createAuthCode(payload: AuthCodePayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", secret()).update(data).digest("base64url");
  return `${data}.${sig}`;
}

/** Verify signature and expiry. Returns payload or null. */
export function verifyAuthCode(code: string): AuthCodePayload | null {
  const dot = code.lastIndexOf(".");
  if (dot === -1) return null;
  const data = code.slice(0, dot);
  const sig = code.slice(dot + 1);
  const expected = createHmac("sha256", secret()).update(data).digest("base64url");
  if (sig !== expected) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString()) as AuthCodePayload;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Verify PKCE S256: SHA-256(code_verifier) should equal code_challenge. */
export function verifyPkce(codeVerifier: string, codeChallenge: string): boolean {
  const hash = createHash("sha256").update(codeVerifier).digest("base64url");
  return hash === codeChallenge;
}
