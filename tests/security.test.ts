import { beforeEach, describe, expect, test } from "bun:test";
import { createSessionValue, verifyAccessCode, verifySessionValue } from "../src/lib/auth";
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
