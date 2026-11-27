import { test } from "node:test";
import assert from "node:assert/strict";
import { choices, readCharacter, characterRewards, starter } from "../src/lib/explorer-character";
import { mergeJournal, validEntry, type Entry } from "../src/lib/explorer";
import { bookKey, bookSets } from "../src/lib/decodable-books";

const entry = (key: string, value: string, at = 1): Entry => ({ key, value, at });

test("all starter parts are available on a new profile and choices validate by category", () => {
  assert.deepEqual(readCharacter({}, 0), starter);
  for (const [part, options] of Object.entries(choices)) {
    for (const id of Object.keys(options)) assert.ok(validEntry(entry("character/" + part, id)));
  }
  for (const [key, value] of [["character/skin","sky"],["character/gear","constructor"],["character/__proto__","gear"],["character/shirt/extra","sky"]]) {
    assert.equal(validEntry(entry(key, value)), false);
  }
});

test("character rewards use existing achievements and incomplete reading and duplicate stamps do not unlock them", () => {
  const id = bookSets[0].books[0].id;
  const partial = mergeJournal({}, [entry(bookKey(id,"word"),"done"), entry("stamp/read","earned"), entry("stamp/read","earned",2)]);
  const locked = characterRewards(partial, 0);
  assert.equal(locked.glasses.available, false);
  assert.equal(locked.crown.available, false);
  assert.equal(locked.pin.available, false);
  const complete = mergeJournal(partial, [entry(bookKey(id,"evidence"),"done"), entry("stamp/sounds","earned"), entry("stamp/field","earned")]);
  assert.ok(Object.values(characterRewards(complete, 1)).every(item => item.available));
});

test("saved looks are profile-local and stale updates cannot undo more recent choices", () => {
  const first = mergeJournal({}, [entry("character/skin","ebony"), entry("character/shirt","berry",3), entry("character/shirt","sky",2), entry("character/gear","glasses")]);
  assert.equal(readCharacter(first, 0).shirt, "berry");
  assert.equal(readCharacter(first, 0).skin, "ebony");
  assert.equal(readCharacter(first, 0).gear, starter.gear);
  const read = mergeJournal(first, [entry(bookKey(bookSets[0].books[0].id,"evidence"),"done")]);
  assert.equal(readCharacter(read, 0).gear, "glasses");
  assert.deepEqual(readCharacter({}, 0), starter);
});
