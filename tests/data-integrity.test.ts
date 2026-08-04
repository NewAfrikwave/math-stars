import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { streakAfterCompletion } from "../src/lib/progress-save";

describe("launch data integrity", () => {
  test("a failed attempt does not consume the date used by a later passing streak", () => {
    const yesterday = new Date("2026-08-03T15:00:00Z");
    const today = new Date("2026-08-04T16:00:00Z");
    expect(streakAfterCompletion(4, yesterday, today)).toBe(5);
  });

  test("the database enforces one current reward and one activity per attempt id", () => {
    const schema = readFileSync(new URL("../prisma/schema.prisma", import.meta.url), "utf8");
    expect(schema).toContain("currentKey  String?  @unique");
    expect(schema).toContain("attemptId String?  @unique");
  });
});
