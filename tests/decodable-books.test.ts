import { test } from "node:test";
import assert from "node:assert/strict";
import { bookSets,bookKey,pages,nextUnread,setFinished,storyHelpers } from "../src/lib/decodable-books";
import { knownStamp,skillInfo,validEntry } from "../src/lib/explorer";

const all=bookSets.flatMap(set=>set.books);
const entry=(key:string,value:string)=>({key,value,at:1});

test("24 unique books have buildable words, one focus spelling, and an evidence line in the story",()=>{
  assert.equal(all.length,24);
  assert.equal(new Set(all.map(b=>b.id)).size,all.length);
  for(const set of bookSets) {
    assert.equal(set.books.length,3);
    assert.ok(skillInfo("pattern-"+set.id));
    for(const b of set.books) {
      assert.equal(b.tiles.join(""),b.word);
      assert.ok(b.tiles.includes(set.mark));
      assert.ok(!b.tiles.includes(b.distractor));
      assert.match(b.lines.join(" ").toLowerCase(),new RegExp("\\b"+b.word+"\\b"));
      assert.equal(new Set(b.choices).size,3);
      assert.ok(b.lines[b.proof]);
      assert.ok(storyHelpers(b).every(word=>!word.includes(" ") && word!==b.word));
    }
  }
});
test("a learner resumes the first unfinished story, then unlocks a shelf sticker",()=>{
  const progress=new Set<string>();
  const has=(key:string)=>progress.has(key);
  const set=bookSets[0];
  for(const b of all) {
    assert.equal(nextUnread(has)?.id,b.id);
    for(const page of pages) {
      const key=bookKey(b.id,page);
      assert.ok(validEntry(entry(key,"done")));
      assert.ok(validEntry(entry("bookhelp/"+b.id+"/"+page,"yes")));
      progress.add(key);
    }
    assert.equal(setFinished(set,has),progress.size>=set.books.length*pages.length);
  }
  assert.equal(nextUnread(has),undefined);
  assert.ok(knownStamp("bookset-short-a"));
  assert.ok(validEntry(entry("slot/1","bookset-short-a")));
  assert.ok(!validEntry(entry("book/unknown/word","done")));
  assert.ok(!validEntry(entry("book/cat-mat/fake","done")));
  assert.ok(!validEntry(entry("book/cat-mat/word","earned")));
});
