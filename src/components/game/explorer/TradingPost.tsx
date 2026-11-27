"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { needsPostGuide, postGuide, postLesson, postPrefix, type PostStep } from "@/lib/trading-post";
import type { Journal, Skill } from "@/lib/explorer";
import { useGameStore } from "@/store/useGameStore";
import { SpeakButton } from "../SpeakButton";
import { AnswerCheer } from "../AnswerCheer";
import { starter } from "@/lib/explorer-character";
import { AnimalPortrait } from "./AnimalPortrait";
import { PipWalkthrough } from "./PipWalkthrough";
import { HomeCharacter } from "./CharacterStudio";
import { record } from "./journal";
import s from "./Explorer.module.css";
import p from "./TradingPost.module.css";

const note = ["The sun is up at the shell market.", "The dock is flooded, so bring the shells over the hill.", "I will meet you by the red flag."];
const route = "Take the hill path.";
const titles = { counter: "Pack Pip’s order", order: "Your turn at the counter", reading: "A delivery for Pip", evidence: "Show Pip your clue" };
type Props = { profile: string; day: string; level: string; entries: Journal; onRoom: () => void };

function Shells({ amount, size, move, disabled }: { amount: number; size: 1 | 10; move?: () => void; disabled?: boolean }) {
  return <div className={p.pieces}>{Array.from({length: amount}, (_, i) => {
    const token = size === 10 ? <span className={p.bundle} aria-hidden="true"><span>10</span><i className={p.beads}>{Array.from({length:10},(_,n)=><i key={n}/>)}</i></span> : <span className={p.shell} aria-hidden="true"/>;
    return move ? <button type="button" key={i} disabled={disabled} aria-label={(size === 10 ? "Ten-shell bundle " : "Single shell ") + (i + 1)} onClick={move}>{token}</button>
      : <span key={i}>{token}</span>;
  })}</div>;
}

function Counter({ start, give, early, complete }: { start: number; give: number; early: boolean; complete: () => void }) {
  const [opened, setOpened] = useState(false);
  const [sentTens, setSentTens] = useState(0);
  const [sentOnes, setSentOnes] = useState(0);
  const [message, setMessage] = useState("");
  const sound = useGameStore(st => st.soundOn);
  const sent = sentTens * 10 + sentOnes;
  const tens = Math.floor(start / 10) - Number(opened) - sentTens;
  const ones = start % 10 + 10 * Number(opened) - sentOnes;
  const prompt = !early && !opened ? "Tap a bundle to trade one ten for ten loose shells." :
    "Tap shells on your mat to send Pip " + give + " shells.";
  function move(size: 1 | 10) {
    if (sent === give) return;
    if (!early && !opened) {
      if (size === 1) { setMessage("Choose a bundle marked 10 to open it."); return; }
      setOpened(true); setMessage("You traded one ten for ten ones. You still have " + start + "!"); return;
    }
    if (size === 10 && sentTens >= Math.floor(give / 10)) { setMessage("The order has enough tens. Choose loose shells now."); return; }
    if (size === 1 && sentOnes >= give % 10) { setMessage("The order has enough ones. Choose a bundle of ten."); return; }
    if (size === 10) setSentTens(sentTens + 1); else setSentOnes(sentOnes + 1);
    setMessage("");
    if (sent + size === give) complete();
  }
  return <><aside className={p.pip}><AnimalPortrait look={{...starter, kind:"owl"}} turn={12}/><p><strong>Pip</strong><br/>“I have {start} shells. Can you pack {give} for my delivery?”</p></aside><h3>{prompt}</h3>{sound && <SpeakButton text={prompt} label="Hear Pip’s directions"/>}
    <div className={p.trays}>
      <section className={p.mat}><h3>Your mat · {start - sent}</h3>
        <Shells amount={tens} size={10} move={()=>move(10)} disabled={sent===give}/>
        <Shells amount={ones} size={1} move={()=>move(1)} disabled={sent===give}/>
      </section>
      <section className={p.basket}><h3>Pip’s basket · {sent} of {give}</h3>
        <Shells amount={sentTens} size={10}/><Shells amount={sentOnes} size={1}/>
      </section>
    </div>
    <div role="status">{message && <p className={s.feedback}>{message}</p>}{message && sound && <SpeakButton text={message} label="Hear Pip"/>}</div>
  </>;
}

export function TradingPost({profile, day, level, entries, onRoom}: Props) {
  const lesson = postLesson(level);
  const prefix = postPrefix(day,level);
  const [index,setIndex] = useState(() => {
    const first = lesson.steps.findIndex(step => !["guided","helped","solo"].includes(entries[prefix+step]?.value));
    return first < 0 ? 0 : first;
  });
  const [done,setDone] = useState(false);
  const [value,setValue] = useState("");
  const [feedback,setFeedback] = useState("");
  const [helped,setHelped] = useState(false);
  const step: PostStep = lesson.steps[index];
  const guide = postGuide(lesson.early, step);
  const [guiding,setGuiding] = useState(() => needsPostGuide(entries, guide));
  useEffect(() => {
    if (guiding && !entries["post-guide/" + guide]) {
      void record(profile, [["post-guide/" + guide, "seen"]]);
    }
  }, [guiding, entries, guide, profile]);
  const [closed,setClosed] = useState(false);
  const audio = useRef<HTMLAudioElement>(null);
  const sound = useGameStore(st => st.soundOn);
  const skill: Skill = step==="counter" ? lesson.early?"counting":"exchange" : step==="order" ? lesson.early?"taking":"transfer" : step==="evidence"?"evidence":lesson.early?"decoding":"idea";
  const correct = step==="order" ? String(lesson.fresh-lesson.freshGive) : step==="evidence" ? note[1] : lesson.early ? "Map" : route;
  const clue = step==="order" ? (lesson.early ? "Start at " + lesson.fresh + " and count back " + lesson.freshGive + " steps." : "Open one ten into ten ones. Take away seven ones, then one ten.") :
    step==="evidence" ? "Which line tells you why the dock is unsafe?" : lesson.early ? "Blend m, a, p. Which object shows Pip where to go?" : "Find the path Pip can still use when the dock is flooded.";
  function hint() {
    setHelped(true); setFeedback(clue);
    void record(profile,[[prefix+step,"hint"],["skill/"+day+"/"+skill+"/hint","seen"]]);
  }
  function finish(answer: string) {
    if (done) return;
    if (step!=="counter" && answer.trim()!==correct) { hint(); return; }
    const assisted = step==="counter" || helped || entries[prefix+step]?.value==="hint";
    const result = assisted ? "helped" : "solo";
    const marks: [string,string][] = [[prefix+step,step==="counter"?"guided":result],["skill/"+day+"/"+skill+"/"+result,"seen"]];
    if (index===lesson.steps.length-1) marks.push(["stamp/shell-post","earned"]);
    void record(profile,marks);
    setDone(true);
    setFeedback(step==="counter" ? "You packed exactly " + lesson.give + " shells. " + (lesson.start-lesson.give) + " are still on your mat." :
      step==="order" ? "You found the change! " + lesson.fresh + " − " + lesson.freshGive + " = " + correct + "." :
      step==="evidence" ? "You found the sentence that explains why the hill path works." : lesson.early ? "You blended the sounds and found Pip’s map!" : "You used the note to choose the safe path.");
  }
  function next() {
    if (index===lesson.steps.length-1) { setClosed(true); return; }
    setGuiding(needsPostGuide(entries, postGuide(lesson.early, lesson.steps[index+1])));
    setIndex(index+1); setDone(false); setHelped(false); setFeedback(""); setValue("");
  }
  const question = step==="order" ? "You have " + lesson.fresh + " shells. Give Pip " + lesson.freshGive + ". How many will you have left?" :
    step==="evidence" ? "Tap the sentence that helped you choose the hill path." : lesson.early ? "Blend the sounds. What should Pip pack?" : "Which way should Pip deliver the shells?";
  return <article className={p.post} style={{"--market-art":"url(/explorer/shell-market.webp)"} as CSSProperties}>
    <header className={p.sign}><div><span>Shell market</span><h1>Pip’s Trading Post</h1></div><div className={p.avatar} data-cheer={done || closed} role="group" aria-label="Your explorer"><HomeCharacter profile={profile}/></div></header>
    {closed ? <section className={s.card}><h2>Delivery complete!</h2><p><AnswerCheer>You earned Pip’s shell sticker.</AnswerCheer></p><button className={s.main} onClick={onRoom}>Put it in my room</button></section> :
      <section className={s.card} key={step}><h2>{titles[step]}</h2>
        {!done && <PipWalkthrough mode={guide} open={guiding} sound={sound} onToggle={setGuiding} onHelp={()=>{
          if (step !== "counter" && !helped) {
            setHelped(true);
            void record(profile,[[prefix+step,"hint"],["skill/"+day+"/"+skill+"/hint","seen"]]);
          }
        }}/>}
        <div hidden={guiding}>
        {step==="counter" ? <Counter start={lesson.start} give={lesson.give} early={lesson.early} complete={()=>finish("")}/> :
          <><p>{question}</p>
            {step==="order" && <form className={s.choices} onSubmit={e=>{e.preventDefault();if(value.trim())finish(value);}}>
              <input className={s.input} inputMode="numeric" aria-label="Shells left" value={value} disabled={done} onChange={e=>setValue(e.target.value)}/>
              <button className={s.main} disabled={done || !value.trim()}>Check my order</button></form>}
            {step==="reading" && lesson.early && <><p className={p.tiles} aria-label="Letters m, a, p">m　a　p</p><audio ref={audio} src="/explorer/map.mp3" preload="none"/>
              <button className={s.choice} onClick={()=>{if(audio.current){audio.current.currentTime=0;void audio.current.play().catch(()=>setFeedback("Sound is unavailable. Slide your finger across m, a, p and say the sounds."));}}}>Hear the sounds</button></>}
            {step==="reading" && !lesson.early && <div className={s.passage}>{note.map(line=><p key={line}>{line}</p>)}
              {sound && <span onClickCapture={()=>{if(!done)hint();}}><SpeakButton text={note.join(" ")} label="Read the note with me"/></span>}</div>}
            {step!=="order" && <div className={step==="evidence"?s.proof:s.choices}>{(step==="evidence"?note:lesson.early?["Cup","Map","Cap"]:["Wait on the dock.",route,"Leave the shells at home."]).map(item=><button className={s.choice} key={item} disabled={done} onClick={()=>finish(item)}>{lesson.early && <span aria-hidden="true">{{Cup:"☕",Map:"🗺️",Cap:"🧢"}[item]} </span>}{item}</button>)}</div>}
            {!done && <button className={s.back} onClick={hint}>Ask Pip for a clue</button>}
          </>}
        <div role="status">{done?<AnswerCheer turn={index}>{feedback}</AnswerCheer>:feedback}</div>
        {done && <button className={s.main} onClick={next}>{index===lesson.steps.length-1?"Collect my shell sticker":"Continue"}</button>}
        </div>
      </section>}
  </article>;
}
