import { createHmac, timingSafeEqual } from "crypto";

export const SESSION_COOKIE = "math_stars_session";
const SESSION_AGE_SECONDS = 60 * 60 * 24 * 30;

function secret() {
  return process.env.SESSION_SECRET || process.env.FAMILY_ACCESS_CODE || "";
}

function signature(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createSessionValue() {
  const expires = Math.floor(Date.now() / 1000) + SESSION_AGE_SECONDS;
  const payload = `family.${expires}`;
  return `${payload}.${signature(payload)}`;
}

export function verifySessionValue(value?: string | null) {
  if (!value || !secret()) return false;
  const [scope, expiresRaw, supplied] = value.split(".");
  if (scope !== "family" || !expiresRaw || !supplied) return false;
  if (Number(expiresRaw) <= Math.floor(Date.now() / 1000)) return false;
  const expected = signature(`${scope}.${expiresRaw}`);
  const a = Buffer.from(expected);
  const b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function verifyAccessCode(code: string) {
  const configured = process.env.FAMILY_ACCESS_CODE || "";
  if (!configured || !code) return false;
  const a = Buffer.from(configured);
  const b = Buffer.from(code);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge: SESSION_AGE_SECONDS,
};
