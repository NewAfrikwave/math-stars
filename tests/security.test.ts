import { beforeEach, describe, expect, test } from "bun:test";
import {
  createAdminSessionValue,
  createSessionValue,
  readSessionValue,
  verifyAccessCode,
  verifyAdminSessionValue,
  verifySessionValue,
} from "../src/lib/auth";
import { hashPassword, normalizeEmail, passwordError, verifyPassword } from "../src/lib/password";
import { hashPin, verifyPin } from "../src/lib/pin";
import { rateLimit } from "../src/lib/rate-limit";

describe("security helpers", () => {
  beforeEach(() => {
    process.env.FAMILY_ACCESS_CODE = "correct horse battery staple";
    process.env.SESSION_SECRET = "0123456789abcdef0123456789abcdef";
  });

  test("accepts only the configured family access code", () => {
    expect(verifyAccessCode("correct horse battery staple")).toBe(true);
    expect(verifyAccessCode("wrong")).toBe(false);
  });

  test("signs sessions and rejects tampering", () => {
    const session = createSessionValue();
    expect(verifySessionValue(session)).toBe(true);
    expect(verifySessionValue(`${session}x`)).toBe(false);
  });

  test("scopes signed sessions to one family account", () => {
    const session = createSessionValue("family-123");
    expect(readSessionValue(session)).toMatchObject({ kind: "account", familyId: "family-123" });
    expect(readSessionValue(session.replace("family-123", "family-456"))).toBeNull();
  });

  test("keeps legacy access separate from family accounts", () => {
    const session = createSessionValue(null);
    expect(readSessionValue(session)).toMatchObject({ kind: "legacy", familyId: null });
  });

  test("creates a separate short-lived admin session", () => {
    const session = createAdminSessionValue();
    expect(verifyAdminSessionValue(session)).toBe(true);
    expect(verifyAdminSessionValue(`${session}x`)).toBe(false);
  });

  test("hashes account passwords and normalizes email addresses", () => {
    const hash = hashPassword("BrightStars2026");
    expect(verifyPassword("BrightStars2026", hash)).toBe(true);
    expect(verifyPassword("WrongPassword1", hash)).toBe(false);
    expect(normalizeEmail(" Parent@Example.COM ")).toBe("parent@example.com");
    expect(passwordError("short")).not.toBeNull();
    expect(passwordError("StrongFamily2026")).toBeNull();
  });

  test("hashes PINs with a unique salt", () => {
    const first = hashPin("1234");
    const second = hashPin("1234");
    expect(first).not.toBe(second);
    expect(verifyPin("1234", first)).toBe(true);
    expect(verifyPin("9999", first)).toBe(false);
  });

  test("rate limiter blocks excess attempts", () => {
    const key = `test-${Date.now()}`;
    expect(rateLimit(key, 2, 60_000).allowed).toBe(true);
    expect(rateLimit(key, 2, 60_000).allowed).toBe(true);
    expect(rateLimit(key, 2, 60_000).allowed).toBe(false);
  });
});
