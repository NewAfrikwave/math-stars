import { test } from "node:test";
import assert from "node:assert/strict";
import { mergeJournal, outcomes, dailyPath, validEntry, trails, type Trail } from "../src/lib/explorer";
import { stages } from "../src/components/game/explorer/activities";
const day="2026-04-08";
const event=(key:string,at:number,value="seen")=>({key,value,at});

test("an assisted school check directs the next day to that skill without moving today's stops",()=>{
  const note=event("skill/2026-04-07/round.1/helped",10);
  const base=mergeJournal({},[note]);
  assert.equal(dailyPath("grade3",base,day)[1],"round");
  const edited=mergeJournal(base,[event("skill/"+day+"/transfer/hint",20)]);
  assert.deepEqual(dailyPath("grade3",edited,day),dailyPath("grade3",base,day));
  assert.equal(dailyPath("grade3",edited,"2026-04-09")[1],"trade");
});
test("later independent work supersedes assistance, and repeated offline updates converge",()=>{
  const entries=[event("skill/"+day+"/meaning/hint",1),event("skill/"+day+"/meaning/helped",2),event("skill/"+day+"/meaning/solo",3),event("slot/0",4,"sounds"),event("slot/0",5,"empty")];
  const journal=mergeJournal({},entries);
  assert.equal(outcomes(journal).meaning.kind,"solo");
  assert.deepEqual(mergeJournal(journal,entries.slice().reverse()),journal);
  assert.deepEqual(mergeJournal({},entries.slice().reverse()),journal);
  assert.equal(journal["slot/0"].value,"empty");
  assert.ok(entries.every(validEntry));
  assert.equal(validEntry(event("skill/"+day+"/made-up/solo",1)),false);
});
test("every grade and variation offers a valid path, answer and passage for evidence",()=>{
  for(const level of ["preschool","grade1","grade2","grade3","grade4"]) {
    assert.equal(new Set(dailyPath(level,{},day)).size,3);
    for(const track of Object.keys(trails) as Trail[]) for(let seed=0;seed<3;seed++) {
      const prompts=stages(track,level,seed);
      assert.ok(prompts.length>=2);
      for(const p of prompts) {
        assert.ok(p.answer && p.clue);
        if(p.choices) assert.equal(p.choices.filter(c=>c===p.answer).length,1);
        if(p.evidence) assert.ok(p.passage?.includes(p.answer));
        if(p.point) assert.equal(String(p.points),p.answer);
      }
    }
  }
});
test("first trading-post lesson connects number-line work, an exchange and independent transfer",()=>{
  const prompts=stages("trade","grade3",0);
  assert.deepEqual(prompts.map(p=>p.answer),["112","Tens","35","25"]);
  assert.deepEqual(prompts[1].scene?.after?.counts,[0,4,12]);
  assert.ok(!prompts[3].guided && prompts[3].scaffold);
  assert.notEqual(stages("trade","grade3",1)[3].answer,prompts[3].answer);
});
