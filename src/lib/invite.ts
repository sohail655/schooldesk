import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/** Creates a random one-time token. Only the hash is stored in the database. */
export function createInviteToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashToken(token) };
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function tokensMatch(token: string, storedHash: string) {
  const a = Buffer.from(hashToken(token), "hex");
  const b = Buffer.from(storedHash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export const INVITE_TTL_DAYS = 7;

export function inviteExpiry(from = new Date()) {
  return new Date(from.getTime() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);
}

/** Password rule shown on the activation screen. */
export function passwordProblems(password: string, phone?: string | null): string[] {
  const problems: string[] = [];
  if (password.length < 8) problems.push("At least 8 characters");
  if (!/\d/.test(password)) problems.push("Include a number");
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits && password.replace(/\D/g, "").includes(digits.slice(-7))) problems.push("Must not contain your phone number");
  return problems;
}
