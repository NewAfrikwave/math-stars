import {test} from "node:test";
import assert from "node:assert/strict";
import {exchange, shellOrder, split, units, worth} from "../src/lib/discovery-games";
import {validEntry} from "../src/lib/explorer";

test("every shell order can be packed without losing value when making change",()=>{
  for(const level of ["preschool","grade1","grade2","grade3","grade4"]) {
    for(const fresh of [false,true]) {
      const [start,take]=shellOrder(level,fresh);
      let mat=split(start);
      const need=split(take);
      for(const unit of [...units].reverse()) {
        if(mat[unit]<need[unit]) {
          const before=worth(mat);
          mat=exchange(mat,unit===1?10:100);
          assert.equal(worth(mat),before);
        }
        assert.ok(mat[unit]>=need[unit]);
        mat[unit]-=need[unit];
      }
      assert.equal(worth(mat),start-take);
    }
  }
});
test("mission checkpoints and earned stickers are accepted by the explorer",()=>{
  for(const id of ["workshop","reef"]) {
    for(const key of ["guided","fresh"]) assert.ok(validEntry({key:"mission/2026-11-27/grade3/"+id+"/"+key,value:"done",at:1}));
    assert.ok(validEntry({key:"stamp/"+id,value:"earned",at:1}));
    assert.ok(validEntry({key:"slot/0",value:id,at:1}));
  }
  assert.equal(validEntry({key:"mission/2026-11-27/grade3/typo/fresh",value:"done",at:1}),false);
});
