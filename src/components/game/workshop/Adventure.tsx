"use client";

import { AnswerCheer } from "@/components/game/AnswerCheer";

import { useState } from "react";
import { useGameStore } from "@/store/useGameStore";
import { useSoundEffects } from "@/hooks/use-sound-effects";
import { SpeakButton } from "../SpeakButton";
import type { SchoolLesson } from "@/lib/school-practice";
import { blendMission, missions, type Mission, type Model, type World } from "./missions";
import { ToyWorld } from "./ToyWorld";
import styles from "./workshop.module.css";

const blendWords: Record<string,string[]> = {
  "blend-1":["spoon","smell","ski","spill","skip"],
  "blend-2":["skirt","smock","spear","skunk","spool"],
  "blend-3":["sponge","smoke","skull","skeleton","skateboard"]
};
export const stickers: Record<World,string> = {blocks:"🧱",river:"🦊",orchard:"🍎",cart:"🚙",spinner:"🎡",reef:"🐠",garden:"🌼",docks:"⛵",playground:"🧺"};
export function activityFor(id:string): Mission | undefined {
  if(id==="build-numbers" || id==="subtract") return {title:id==="subtract"?"The Trading Post":"Build a Block Tower",world:"blocks",rounds:[]};
  if(blendWords[id]) return blendMission(blendWords[id]);
  return missions[id];
}
function describe(world:World,model:Model) {
  switch(world) {
    case "blocks": return (model.counts??[]).map((n,i)=>n+" "+["hundreds","tens","ones"][i]).join(", ");
    case "docks": return (model.position??-1)<0?"The word crate is at the starting pier.":"Crate at the "+model.labels?.[model.position!]+" dock.";
    case "river": return "Pip is at "+model.labels?.[(model.position??-1)<0?3:model.position!] + ".";
    case "orchard": return (model.counts??Array(model.rows??3).fill(model.each??0)).map((n,i)=>"Basket "+(i+1)+": "+n).join(". ");
    case "cart": return "Buggy at tile "+Math.max(0,model.position??0)+".";
    case "spinner": return "The ride makes "+(model.turns??0)+" turns in one interval.";
    case "garden": return model.night?"Early morning. One open flower.":"Midday. Four open flowers.";
    case "reef": return model.rows!==undefined?"Reef growth stage "+model.rows+".": "A coral polyp, a small reef fish and water surround the diver.";
    case "playground": return model.position===1?"Two children are together on the bench.":"One child is on the bench. The other has their own space.";
  }
}

export function Adventure({lesson,onPractice,onStamp}:{lesson:SchoolLesson;onPractice:()=>void;onStamp:()=>void}) {
  const mission=activityFor(lesson.id);
  const sound=useGameStore(s=>s.soundOn);
  const effects=useGameStore(s=>s.siteSettings?.soundEffectsEnabled!==false);
  const {playCorrect}=useSoundEffects(sound && effects);
  const [round,setRound]=useState(0);
  const [answer,setAnswer]=useState<Model>({});
  const [feedback,setFeedback]=useState("");
  const [solved,setSolved]=useState(false);
  const [attempt,setAttempt]=useState(0);
  const [misses,setMisses]=useState(0);
  const [coach,setCoach]=useState(false);
  const [collected,setCollected]=useState(false);
  const [prediction,setPrediction]=useState("");
  const [trials,setTrials]=useState<number[]>([]);
  const [removed,setRemoved]=useState([0,0]);
  const [history,setHistory]=useState<Model[]>([]);
  if(!mission) return null;
  const build=lesson.id==="build-numbers";
  const trade=lesson.id==="subtract";
  const packing=lesson.id==="groups";
  const experiment=lesson.id==="fair-test" && round===0;
  const world=mission.world;
  const total=build||trade||packing?2:mission.rounds.length;
  const challenge=mission.rounds[round];
  const start:Model=build?{counts:[0,0,0]}:trade?{counts:round===0?[0,5,2]:[0,6,3]}:packing?{rows:round===0?3:4,counts:Array(round===0?3:4).fill(0)}:challenge.start;
  const model={...start,...answer};
  const target=build?(round===0?[2,3,4]:[3,0,5]):packing? (round===0?4:2):0;
  const prompt=build?"Build "+(round===0?234:305)+". Tap each tray to add a block.":
    trade?"Start with "+(round===0?"52. Take away 17.":"63. Take away 18.")+" Trade a ten when you need more ones.":
    packing?"Pack "+(round===0?3:4)+" baskets with "+target+" apples each. Tap a basket to add one apple.":challenge.prompt;
  const stateText=describe(world,model);
  const cargo=blendWords[lesson.id]?.[round];
  function win(message:string) {
    setSolved(true);setFeedback(message);playCorrect();
  }
  function reset() {
    setAnswer({});setFeedback("");setSolved(false);setAttempt(0);setMisses(0);setCoach(false);setTrials([]);setPrediction("");setRemoved([0,0]);
  }
  function act(i:number) {
    if(solved||collected) return;
    setAttempt(n=>n+1);
    if(build||packing) {
      const counts=[...model.counts!];
      const limit=build?9:6;
      if(counts[i]>=limit){setFeedback("That tray is full. Use Undo to take one back.");return;}
      counts[i]+=1; setAnswer({counts});setFeedback("");setHistory(prev=>[...prev,model]);return;
    }
    if(trade) {
      const counts=[...model.counts!];
      const needed=round===0?7:8;
      let [tens,ones]=removed;
      if(i===0){
        if(counts[2]>=needed-ones){setFeedback("You already have enough loose ones to finish.");return;}
        counts[1]--;counts[2]+=10;setFeedback("One ten became ten ones. The total stayed the same.");
      } else if(i===1) {
        if(tens===1){setFeedback("You already took away the one ten. Work on the ones.");return;}
        counts[1]--;tens++;setFeedback("You took away one ten.");
      } else {
        if(ones===needed){setFeedback("All the required ones are gone. Check the tens.");return;}
        if(counts[2]===0){setFeedback("The ones tray is empty. Trade a ten to make ten more ones.");return;}
        counts[2]--;ones++;setFeedback("One more taken away.");
      }
      setRemoved([tens,ones]);setAnswer({counts});
      if(tens===1 && ones===needed)win("You have "+(counts[1]*10+counts[2])+" left. You traded without changing the starting amount.");
      return;
    }
    const move=challenge.moves[i];
    if(!move)return;
    setAnswer(move.model);
    if(experiment) {
      if(!prediction) return;
      const tried = [...new Set([...trials,i])];
      setTrials(tried);
      if(tried.length===2) win("You measured 2 tiles with a gentle push and 5 with a stronger push. Compare that with your prediction.");
      else setFeedback("You measured "+move.model.position+" tiles. Run the other trial on the same track.");
      return;
    }
    if(i===challenge.answer)win(move.result);else {setFeedback(move.result);setMisses(n=>n+1);if(misses>=1)setCoach(true);}
  }
  function checkBuild(){
    if(solved)return;
    const counts=model.counts!;
    const desired=Array.isArray(target)?target:counts.map(()=>target);
    const first=counts.findIndex((n,i)=>n!==desired[i]);
    if(first<0){win(build?"You built "+(round===0?234:305)+"!":"Every basket matches. You packed "+counts.reduce((a,b)=>a+b,0)+" apples.");return;}
    setMisses(n=>n+1);if(misses>=1)setCoach(true);
    const place=build?["hundreds tray","tens tray","ones tray"][first]:"basket "+(first+1);
    setFeedback("Look at the "+place+". It has "+counts[first]+" and needs "+desired[first]+".");
  }
  function advance() {
    if(round+1===total){setCollected(true);onStamp();return;}
    reset();setHistory([]);setRound(round+1);
  }
  const actions=trade?["Trade 1 ten","Take away 1 ten","Take away 1 one"]:build?["+ Hundred","+ Ten","+ One"]:packing?model.counts!.map((_,i)=>"+ Basket "+(i+1)):challenge.moves.map(move=>move.label);
  function guide() {
    if(experiment) return prediction ? "Run both pushes and compare the tile numbers." : "Make a guess first. Then see what the buggy does.";
    if (build || packing) {
      const desired = Array.isArray(target) ? target : model.counts!.map(()=>target);
      const index = model.counts!.findIndex((n,i)=>n!==desired[i]);
      if(index < 0) return "The amounts match. Choose Check my build.";
      const extra = model.counts![index] > desired[index];
      return extra ? "Undo the extra block or apple, then compare each tray again." :
        "Try " + actions[index] + ". Count to " + desired[index] + " in that tray.";
    }
    if(trade) return model.counts![2] < (round===0?7:8)-removed[1] ? "Choose Trade 1 ten. Watch the ones tray grow." :
      removed[0]===0 ? "Take away the ten first. Then remove the required ones." : "Take away one loose cube at a time.";
    return "Try " + challenge.moves[challenge.answer].label + ". Watch the model and explain what changed.";
  }
  return <section className={styles.game} aria-label={mission.title}>
    <header className={styles.heading}><div><h2>{mission.title}</h2>
      <div className={styles.progress} aria-label={collected?"Complete":"Challenge "+(round+1)+" of "+total}>
        {Array.from({length:total},(_,i)=><i key={i} data-done={collected||i<round||(i===round&&solved)}/>)}</div></div>
      {sound&&<SpeakButton key={collected?"stamp":round} text={collected?"You earned your adventure sticker.":prompt} label="Listen"/>}
    </header>
    <ToyWorld world={world} model={model} cargo={cargo} active={!solved&&!collected} spinKey={round*100+attempt} description={stateText}
      onPick={trade?undefined:act}/>
    <div className={styles.body}>{collected?<>
      <strong className={styles.prompt}>{stickers[world]} You earned the {mission.title} sticker!</strong>
      <div className={styles.actions}><button className={styles.next} onClick={onPractice}>Try it on your own</button>
      <button className={styles.quiet} onClick={()=>{reset();setHistory([]);setRound(0);setCollected(false);}}>Play again</button></div>
    </>:<>
      <p className={styles.prompt}>{prompt}</p>
      {cargo&&<p>Drag the word onto a dock sign, or tap a dock.</p>}
      {(build||packing||trade)&&<p>{stateText}{trade&&" · Taken away: "+removed[0]+" ten and "+removed[1]+" ones."}</p>}
      {experiment && <fieldset className={styles.coach}><legend>Predict which push will move the buggy farther.</legend>
        <div className={styles.actions}>{["Gentle","Stronger","Same distance"].map(guess=><button key={guess} disabled={trials.length>0} aria-pressed={guess===prediction} className={guess===prediction?styles.next:styles.action} onClick={()=>setPrediction(guess)}>{guess}</button>)}</div>
        {trials.length>0 && <p>My measurements · {trials.map(i=>i===0?"Gentle: 2 tiles":"Stronger: 5 tiles").join(" · ")}</p>}
      </fieldset>}
      <div className={styles.actions}>{actions.map((label,i)=><button key={label} className={styles.action} data-drop={cargo?i:undefined} disabled={solved||(experiment&&!prediction)} onClick={()=>act(i)}>{label}</button>)}</div>
      {(build||packing)&&!solved&&<div className={styles.actions}><button className={styles.next} onClick={checkBuild}>Check my build</button>
        <button disabled={!history.length} className={styles.quiet} onClick={()=>{setAnswer(history[history.length-1]);setHistory(history.slice(0,-1));setFeedback("");}}>Undo</button></div>}
      {!solved && (coach ? <div className={styles.coach}><strong>Pip’s clue</strong><p>{guide()}</p>{sound && <SpeakButton text={guide()} label="Hear clue"/>}</div>
        : <button className={styles.quiet} onClick={()=>setCoach(true)}>{misses>=2?"Let Pip walk me through it":"Ask Pip for a clue"}</button>)}
      {feedback&&<p role="status" className={styles.feedback}>{solved ? <AnswerCheer turn={round}>{feedback}</AnswerCheer> : feedback}</p>}
      {solved&&<button className={styles.next} onClick={advance}>{round+1===total?"Collect my sticker":"Next challenge"}</button>}
    </>}</div>
  </section>;
}

