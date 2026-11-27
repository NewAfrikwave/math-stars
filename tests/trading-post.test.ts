import { test } from "node:test";
import assert from "node:assert/strict";
import { validEntry, mergeJournal } from "../src/lib/explorer";
import { postLesson, postTakeaway } from "../src/lib/trading-post";

test("each learner gets a new order after the guided shell trade", () => {
  for (const level of ["preschool","grade1","grade2","grade3","grade4"]) {
    const lesson = postLesson(level);
    assert.notEqual(lesson.start - lesson.give, lesson.fresh - lesson.freshGive);
    assert.ok(lesson.early ? lesson.start < 10 : lesson.start % 10 < lesson.give % 10);
    assert.ok(lesson.early || lesson.fresh % 10 < lesson.freshGive % 10);
    assert.equal(lesson.steps.includes("evidence"), !lesson.early);
  }
});

test("recap needs an observed trade and a finished order for the same day and grade", () => {
  const prefix = "post/2026-11-25/grade3/";
  const counter = { key: prefix + "counter", at:1, value:"guided" };
  const order = { key: prefix + "order", at:2, value:"solo" };
  assert.ok(validEntry(counter) && validEntry(order));
  assert.equal(validEntry({...order,key:"post/2026-11-25/preschool/evidence"}),false);
  assert.equal(postTakeaway(mergeJournal({},[order]),"2026-11-20"),null);
  const entries = mergeJournal({},[counter, order]);
  assert.match(postTakeaway(entries,"2026-11-20")!,/43 − 17 independently/);
  assert.match(postTakeaway(mergeJournal(entries,[{...order,at:3,value:"helped"}]),"2026-11-20")!,/with a clue/);
  assert.equal(postTakeaway(entries,"2026-11-26"),null);
  assert.ok(validEntry({key:"stamp/shell-post",value:"earned",at:3}));
  assert.ok(validEntry({key:"slot/0",value:"shell-post",at:4}));
});
