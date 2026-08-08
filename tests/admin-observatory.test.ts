import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { buildCurriculumDomainStats } from "../src/lib/admin-curriculum-progress";
import { buildActivitySeries, countInstalledFamilies, summarizeGradeStats } from "../src/lib/admin-analytics";

describe("admin learning observatory", () => {
  test("calculates each curriculum domain against learners in its own grade", () => {
    const gradeDefinitions = [
      {
        level: "grade1",
        curricula: [{ id: "g1-add", title: "Grade 1 Addition", emoji: "+", lessons: [{ id: "g1-a" }, { id: "g1-b" }] }],
      },
      {
        level: "grade2",
        curricula: [{ id: "g2-add", title: "Grade 2 Addition", emoji: "+", lessons: [{ id: "g2-a" }] }],
      },
      {
        level: "grade4",
        curricula: [{ id: "g4-add", title: "Grade 4 Addition", emoji: "+", lessons: [{ id: "g4-a" }] }],
      },
    ] as const;
    const learners = [
      { id: "first-grader", level: "grade1" },
      { id: "second-grader-1", level: "grade2" },
      { id: "second-grader-2", level: "grade2" },
      { id: "second-grader-3", level: "grade2" },
    ];
    const completed = [
      { studentId: "first-grader", lessonId: "g1-a" },
      { studentId: "second-grader-1", lessonId: "g2-a" },
      { studentId: "second-grader-2", lessonId: "g2-a" },
    ];

    expect(buildCurriculumDomainStats(gradeDefinitions, learners, completed)).toEqual([
      { id: "g1-add", title: "Grade 1 Addition", emoji: "+", completed: 1, total: 2 },
      { id: "g2-add", title: "Grade 2 Addition", emoji: "+", completed: 2, total: 3 },
      { id: "g4-add", title: "Grade 4 Addition", emoji: "+", completed: 0, total: 0 },
    ]);
  });

  test("wires the desktop Help control to an accessible admin guide", () => {
    const source = readFileSync(new URL("../src/components/game/AdminView.tsx", import.meta.url), "utf8");

    expect(source).toContain("<AdminHelpDialog onNavigate={onChange} />");
    expect(source).toContain("<DialogTrigger asChild>");
    expect(source).toContain("<DialogTitle");
    expect(source).toContain("onClick={() => onNavigate(destination.tab)}");
  });

  test("provides a dedicated administrator route separate from family sign in", () => {
    const gate = readFileSync(new URL("../src/components/AccessGate.tsx", import.meta.url), "utf8");
    const portal = readFileSync(new URL("../src/components/admin/AdminPortal.tsx", import.meta.url), "utf8");
    const page = readFileSync(new URL("../src/app/admin/page.tsx", import.meta.url), "utf8");

    expect(gate).toContain('const adminPage = pathname === "/admin"');
    expect(gate).toContain('href="/admin"');
    expect(gate).not.toContain('mathstars-open-admin');
    expect(page).toContain("<AdminPortal />");
    expect(portal).toContain("Owner access code");
    expect(portal).toContain("Four-digit admin PIN");
    expect(portal).toContain("<AdminView standalone />");
  });

  test("counts family install adoption once per family, including an explicit legacy family", () => {
    const devices = [
      { familyId: "family-a", scopeKey: "family-a", installed: true },
      { familyId: "family-a", scopeKey: "family-a", installed: true },
      { familyId: "family-b", scopeKey: "family-b", installed: false },
      { familyId: null, scopeKey: "legacy", installed: true },
      { familyId: null, scopeKey: "orphan", installed: true },
    ];

    expect(countInstalledFamilies(devices, true)).toBe(2);
    expect(countInstalledFamilies(devices, false)).toBe(1);
  });

  test("uses lesson scores only for the lesson mastery series", () => {
    const date = new Date(2026, 7, 8, 12);
    expect(buildActivitySeries(["2026-08-08"], [
      { type: "lesson", score: 80, createdAt: date },
      { type: "lesson", score: 100, createdAt: date },
      { type: "daily", score: 10, createdAt: date },
      { type: "placement", score: 20, createdAt: date },
      { type: "arcade", score: 30, createdAt: date },
    ])).toEqual([{ date: "2026-08-08", count: 5, lessons: 2, arcade: 1, avgScore: 90 }]);
  });

  test("sums active learners separately from enrolled learners", () => {
    expect(summarizeGradeStats([
      { learners: 5, activeLearners: 2, lessonsCompleted: 4, avgScore: 75 },
      { learners: 3, activeLearners: 1, lessonsCompleted: 2, avgScore: 90 },
    ])).toEqual({ learners: 8, activeLearners: 3, lessons: 6, weightedScore: 480 });
  });

  test("keeps a mobile exit control in the admin navigation", () => {
    const source = readFileSync(new URL("../src/components/game/AdminView.tsx", import.meta.url), "utf8");
    expect(source).toContain("<span>Exit</span>");
    expect(source).toContain("lg:hidden");
    expect(source).toContain("onClick={onExit}");
  });
});
