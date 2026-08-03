import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

export function hashPin(pin: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pin, salt, 32).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPin(pin: string, stored: string | null | undefined) {
  if (!stored) return false;
  if (!stored.startsWith("scrypt$")) return pin === stored;
  const [, salt, hash] = stored.split("$");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const supplied = scryptSync(pin, salt, expected.length);
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}

export function pinFrom(req: Request) {
  return req.headers.get("x-parent-pin") || req.headers.get("x-admin-pin") || "";
}
