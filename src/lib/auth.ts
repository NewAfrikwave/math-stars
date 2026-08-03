import { createHmac, timingSafeEqual } from "crypto";

export const SESSION_COOKIE = "math_stars_session";
export const ADMIN_SESSION_COOKIE = "math_stars_admin_session";
const SESSION_AGE_SECONDS = 60 * 60 * 24 * 30;
const ADMIN_SESSION_AGE_SECONDS = 60 * 60 * 2;

export type AppSession =
  | { kind: "account"; familyId: string; expires: number }
  | { kind: "legacy"; familyId: null; expires: number };

function secret() {
  return process.env.SESSION_SECRET || process.env.FAMILY_ACCESS_CODE || "";
}

function signature(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createSessionValue(familyId?: string | null) {
  const expires = Math.floor(Date.now() / 1000) + SESSION_AGE_SECONDS;
  const payload = familyId ? `account.${familyId}.${expires}` : `legacy.${expires}`;
  return `${payload}.${signature(payload)}`;
}

export function readSessionValue(value?: string | null): AppSession | null {
  if (!value || !secret()) return null;
  const parts = value.split(".");
  const scope = parts[0];
  const isAccount = scope === "account";
  const familyId = isAccount ? parts[1] : null;
  const expiresRaw = isAccount ? parts[2] : parts[1];
  const supplied = isAccount ? parts[3] : parts[2];
  if (!expiresRaw || !supplied || (scope !== "account" && scope !== "legacy" && scope !== "family")) return null;
  const expires = Number(expiresRaw);
  if (!Number.isFinite(expires) || expires <= Math.floor(Date.now() / 1000)) return null;
  const payload = isAccount ? `${scope}.${familyId}.${expiresRaw}` : `${scope}.${expiresRaw}`;
  const expected = signature(payload);
  const a = Buffer.from(expected);
  const b = Buffer.from(supplied);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (isAccount && familyId) return { kind: "account", familyId, expires };
  // "family" is the pre-account cookie and remains the legacy owner scope.
  return { kind: "legacy", familyId: null, expires };
}

export function verifySessionValue(value?: string | null) {
  return !!readSessionValue(value);
}

function cookieValue(req: Request, name: string) {
  const cookie = req.headers.get("cookie") ?? "";
  return cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1);
}

export function sessionFromRequest(req: Request) {
  return readSessionValue(cookieValue(req, SESSION_COOKIE));
}

export function createAdminSessionValue() {
  const expires = Math.floor(Date.now() / 1000) + ADMIN_SESSION_AGE_SECONDS;
  const payload = `admin.${expires}`;
  return `${payload}.${signature(payload)}`;
}

export function verifyAdminSessionValue(value?: string | null) {
  if (!value || !secret()) return false;
  const [scope, expiresRaw, supplied] = value.split(".");
  if (scope !== "admin" || !expiresRaw || !supplied || Number(expiresRaw) <= Math.floor(Date.now() / 1000)) return false;
  const expected = signature(`${scope}.${expiresRaw}`);
  const a = Buffer.from(expected);
  const b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function isAdminRequest(req: Request) {
  return verifyAdminSessionValue(cookieValue(req, ADMIN_SESSION_COOKIE));
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

export const adminSessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge: ADMIN_SESSION_AGE_SECONDS,
};
