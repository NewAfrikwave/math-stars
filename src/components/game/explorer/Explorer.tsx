"use client";

import { AnswerCheer } from "@/components/game/AnswerCheer";
import { useEffect,useRef,useState,type CSSProperties,type ReactNode } from "react";
import { useGameStore } from "@/store/useGameStore";
import { dailyPath,dayKey,trails,type Trail,type Journal } from "@/lib/explorer";
import { lessons } from "@/lib/school-practice";
import { ToyWorld } from "../workshop/ToyWorld";
import { activityFor,stickers } from "../workshop/Adventure";
import { SpeakButton } from "../SpeakButton";
import { record,useJournal } from "./journal";
import { Bookshelf } from "./Bookshelf";
import { bookSets, setFinished } from "@/lib/decodable-books";
import { stages,type Stage } from "./activities";
import s from "./Explorer.module.css";

export function Explorer({start,room=false,books=false}:{start?:Trail;room?:boolean;books?:boolean}) {
  const profile=useGameStore(st=>st.currentProfileId);
  const level=useGameStore(st=>st.level)??"grade3";
  return profile?<Hub key={profile} profile={profile} level={level} start={start} room={room} books={books}/>:null;
}
function Hub({profile,level,start,room,books}:{profile:string;level:string;start?:Trail;room:boolean;books:boolean}) {
  const home=useGameStore(st=>st.setView);
  const {entries,ready,status,refresh}=useJournal(profile);
  const [trail,setTrail]=useState<Trail|undefined>(start);
  const [inRoom,setRoom]=useState(room);
  const [inBooks,setBooks]=useState(books);
  const [day,setDay]=useState(()=>dayKey());
  useEffect(()=>{const timer=setInterval(()=>setDay(dayKey()),30000);return ()=>clearInterval(timer);},[]);
  const path=dailyPath(level,entries,day);
  const [finished,setFinished]=useState<Trail|null>(null);
  const go=(t:Trail)=>{setTrail(t);setFinished(null);};
  const back=()=>{if(trail || inRoom || finished || inBooks){setBooks(false);setTrail(undefined);setRoom(false);setFinished(null);}else home({name:"home"});};
  const controls=["Warm up","Stretch a skill","Read and discover"];
  return <main className={s.page}>
    <button className={s.back} onClick={back}>{trail||inRoom||finished||inBooks?"Back to my path":"Back to home"}</button>
    {!ready?<section className={s.card} role="status">Opening your explorer notebook…</section>:
      inBooks?<Bookshelf profile={profile} entries={entries} openActivity={t=>{setBooks(false);go(t);}}/>:
      inRoom?<Room profile={profile} entries={entries} onFind={()=>setRoom(false)}/>:
      trail?<TrailGame key={day+trail} day={day} level={level} trail={trail} profile={profile} entries={entries} finish={()=>{
        void record(profile,[["finish/"+day+"/"+trail,"done"],["stamp/"+trail,"earned"]]);
        setFinished(trail);setTrail(undefined);
      }}/>:
      <>
        <header className={s.banner}><span className={s.tag}>Today’s discovery path</span><h1>Three little adventures</h1>
          <p>Start with a warm-up, stretch a skill, then explore a story or experiment.</p></header>
        {finished && <section className={s.card} role="status"><h2>{trails[finished][1]} Sticker earned: {trails[finished][0]}!</h2>
          <button className={s.main} onClick={()=>setRoom(true)}>Put it in my room</button></section>}
        <div className={s.grid}>{path.map((t,i)=><button className={s.stop} key={t} onClick={()=>go(t)}><span aria-hidden="true">{trails[t][1]}</span><small>{controls[i]}</small>{trails[t][0]}<small>{entries["finish/"+day+"/"+t]?"✓ Finished · play again":"Start or continue"}</small></button>)}</div>
        <section className={s.card}><h2>Choose your own adventure</h2><div className={s.choices}>
          {(Object.keys(trails) as Trail[]).filter(t=>level!=="preschool"&&level!=="grade1" || !["trade","round","groups"].includes(t)).map(t=><button className={s.choice} key={t} onClick={()=>go(t)}>{trails[t][1]} {trails[t][0]}</button>)}
          <button className={s.choice} onClick={()=>setBooks(true)}>Open my bookshelf</button>
          <button className={s.main} onClick={()=>setRoom(true)}>Visit my explorer room</button></div></section>
      </>}
    {status==="waiting" && <p className={s.note} role="status">Family sync is pending. <button onClick={()=>void refresh()}>Try sync again</button></p>}
    {status==="device" && <p role="status">Device storage is unavailable. Keep this page open until your work syncs.</p>}
  </main>;
}
function TrailGame({profile,trail,day,level,entries,finish}:{profile:string;trail:Trail;day:string;level:string;entries:Journal;finish:()=>void}) {
  const dayNumber=Math.floor(Date.parse(day+"T12:00:00Z")/86400000);
  const seed=trail==="trade" && !entries["stamp/trade"]?0:dayNumber+Math.floor(dayNumber/3);
  const [steps]=useState(()=>stages(trail,level,seed));
  const [index,setIndex]=useState(()=>{
    if(entries["finish/"+day+"/"+trail]) return 0;
    const missing=steps.findIndex((_,i)=>!entries["step/"+day+"/"+trail+"/"+i]);
    return missing<0?0:missing;
  });
  const [fresh,setFresh]=useState(false);
  const [neededHelp,setNeededHelp]=useState(false);
  const variant=stages(trail,level,seed+1)[index];
  const stage=fresh?variant:steps[index];
  const followUp=!fresh && neededHelp && !stage.guided && !stage.evidence && stage.skill!=="sequence"
    && (variant.answer!==stage.answer || variant.prompt!==stage.prompt);
  const aid="aid/"+day+"/"+trail+"/"+index;
  return <><header className={s.banner}><span className={s.tag}>Step {index+1} of {steps.length}</span><h1>{trails[trail][0]}</h1></header>
    <Challenge key={index+":"+fresh} stage={stage} seed={seed+index} previousHelp={!fresh && entries[aid]?.value==="yes"} assist={()=>void record(profile,[[aid,"yes"],["skill/"+day+"/"+stage.skill+"/hint","seen"]])}
      solved={help=>{setNeededHelp(help);void record(profile,[["skill/"+day+"/"+stage.skill+"/"+(help?"helped":"solo"),"seen"]]);}}
      practiceAgain={followUp}
      next={()=>{
        if(followUp) {
          setFresh(true);setNeededHelp(false);return;
        }
        setFresh(false);setNeededHelp(false);void record(profile,[[aid,"no"],["step/"+day+"/"+trail+"/"+index,"done"]]);if(index===steps.length-1) finish();else setIndex(index+1);}} last={index===steps.length-1}/></>;
}
function Challenge({stage,seed,previousHelp,practiceAgain,assist,solved,next,last}:{stage:Stage;practiceAgain:boolean;previousHelp:boolean;seed:number;assist:()=>void;solved:(help:boolean)=>void;next:()=>void;last:boolean}) {
  const sound=useGameStore(st=>st.soundOn);
  const models=useGameStore(st=>st.siteSettings?.manipulativesEnabled!==false);
  const [hint,setHint]=useState(!!stage.guided || previousHelp);
  const [ok,setOk]=useState(false);
  const [entry,setEntry]=useState("");
  const [points,setPoints]=useState<number[]>([]);
  const [scaffold,setScaffold]=useState(false);
  const [message,setMessage]=useState<ReactNode>("");
  const audio=useRef<HTMLAudioElement>(null);
  const choices=stage.choices??[];
  const offset=(seed+1)%Math.max(1,choices.length);
  const ordered=stage.evidence?choices:[...choices.slice(offset),...choices.slice(0,offset)];
  function help() {if(!hint) assist();setHint(true);}
  function answer(value:string) {
    if(ok) return;
    if(value.trim()===stage.answer){setOk(true);setMessage(stage.success);solved(hint);}
    else {help();setMessage("Let’s try that step again. "+stage.clue);}
  }
  function point(i:number) {
    if(ok || points.includes(i)) return;
    const chosen=[...points,i];setPoints(chosen);
    if(chosen.length===stage.points) answer(String(chosen.length));
  }
  return <section className={s.card}>
    <h2>{stage.prompt}</h2>
    {sound && <SpeakButton text={stage.prompt} label="Hear the question"/>}
    {stage.sounds && <div className={s.passage}><p aria-label={"Letters "+stage.sounds.split("").join(", ")}><strong>{stage.sounds.split("").join("　")}</strong></p>
      <audio ref={audio} src={"/explorer/"+stage.sounds+".mp3"} preload="none"/>
      <button className={s.choice} onClick={()=>{if(audio.current){audio.current.currentTime=0;void audio.current.play().catch(()=>setMessage("Use the letter tiles to blend the word."));}}}>Hear the sounds</button>
      {ok && sound && <SpeakButton text={stage.sounds} label="Hear the whole word"/>}</div>}
    {stage.passage && !stage.evidence && <div className={s.passage}>{stage.passage.map(text=><p key={text}>{text}</p>)}
      {sound && <span onClickCapture={()=>{if(!ok)help();}}><SpeakButton text={stage.passage.join(" ")} label="Read it with me"/></span>}</div>}
    {stage.scene && (models?<ToyWorld world={stage.scene.world} model={ok&&stage.scene.after?stage.scene.after:stage.scene.model} active={!ok} spinKey={ok?1:0}
      pointMode={stage.point} touched={points} description={ok?stage.success:stage.scene.description}
      onPick={stage.point?point:stage.scene.world==="blocks"&&choices.length?i=>answer(["Hundreds","Tens","Ones"][i]):stage.scene.world==="river"&&choices.length?i=>answer(choices[i]):undefined}/>:<p className={s.passage}>{ok?stage.success:stage.scene.description}</p>)}
    {stage.point?<div className={s.choices}>{Array.from({length:stage.points!},(_,i)=><button className={s.choice} key={i} disabled={ok} aria-pressed={points.includes(i)} onClick={()=>point(i)}>{stage.point==="baskets"?"Basket":"Apple"} {i+1} {points.includes(i)?"✓":""}</button>)}</div>:
      choices.length?<div className={stage.evidence?s.proof:s.choices}>{ordered.map(item=><button className={s.choice} key={item} disabled={ok} onClick={()=>answer(item)}>{item}</button>)}</div>:
      <form className={s.choices} onSubmit={e=>{e.preventDefault();if(entry.trim())answer(entry);}}><input aria-label="My answer" className={s.input} inputMode="numeric" autoComplete="off" value={entry} disabled={ok} onChange={e=>setEntry(e.target.value)}/><button className={s.main} disabled={ok || !entry.trim()}>Check</button></form>}
    {!ok && !hint && <button className={s.back} onClick={help}>Give me a clue</button>}
    {hint&&!ok&&<div className={s.feedback}><p>{stage.clue}</p>{stage.scaffold&&!scaffold&&<><strong>{stage.scaffold.prompt}</strong><div className={s.choices}>
      {stage.scaffold.choices.map(c=><button className={s.choice} key={c} onClick={()=>{const right=c===stage.scaffold!.answer;setScaffold(right);setMessage(right?<AnswerCheer turn={seed}>Use that step to try the original question.</AnswerCheer>:"Count again with Pip’s clue.");}}>{c}</button>)}</div></>}</div>}
    <p role="status">{ok ? <AnswerCheer turn={seed}>{message}</AnswerCheer> : message}</p>{ok && <button className={s.main} onClick={next}>{practiceAgain?"Try a fresh example":last?"Collect my sticker":"Next step"}</button>}
  </section>;
}
function stamp(id:string):readonly [string,string] {
  const set=bookSets.find(item=>id==="bookset-"+item.id);
  if(set) return [set.name,set.icon];
  if(!id.startsWith("school-"))return trails[id as Trail]??["Explorer sticker","⭐"];
  const lesson=lessons.find(l=>l.id===id.slice(7));
  const activity=activityFor(id.slice(7));
  return [lesson?.title??"School sticker",activity?stickers[activity.world]:"⭐"];
}
function Room({profile,entries,onFind}:{profile:string;entries:Journal;onFind:()=>void}) {
  const [choice,setChoice]=useState("");
  const [turn,setTurn]=useState(0);
  const [note,setNote]=useState("");
  const owned=Object.keys(entries).filter(k=>k.startsWith("stamp/")).map(k=>k.slice(6)).sort();
  for(const set of bookSets) if(setFinished(set,key=>!!entries[key])) owned.push("bookset-"+set.id);
  const places=["Window shelf","Reading nook","Work table","Treasure shelf"];
  return <><header className={s.banner}><span className={s.tag}>My collection</span><h1>Explorer room</h1><p>Choose a sticker, then touch a shelf to display it.</p></header>
    <div className={s.scene}><div className={s.room} style={{"--turn":turn+"deg"} as CSSProperties}>{places.map((label,i)=>{
      const current=entries["slot/"+i]?.value;const item=current&&current!=="empty"?stamp(current):null;
      return <button key={label} className={s.place} aria-label={label+", "+(item?.[0]??"empty")} onClick={()=>{
        if(!choice){setNote("Choose a sticker or choose Clear a spot first.");return;}
        void record(profile,[["slot/"+i,choice]]);setNote(choice==="empty"?label+" cleared.":stamp(choice)[0]+" placed on the "+label.toLowerCase()+".");
      }}><span aria-hidden="true">{item?.[1]??"·"}</span>{label}</button>;
    })}</div></div><div className={s.choices}><button className={s.back} onClick={()=>setTurn(Math.max(-18,turn-9))}>Turn room left</button><button className={s.back} onClick={()=>setTurn(Math.min(18,turn+9))}>Turn room right</button></div>
    <section className={s.card}><h2>My stickers</h2>{owned.length?<div className={s.rack}>{owned.map(id=><button className={s.token} key={id} aria-pressed={choice===id} onClick={()=>{setChoice(id);setNote("Now choose a shelf.");}}>{stamp(id)[1]} {stamp(id)[0]}</button>)}
      <button className={s.token} aria-pressed={choice==="empty"} onClick={()=>setChoice("empty")}>Clear a spot</button></div>:<p>Your first finished adventure earns a sticker for this room.</p>}
      <p role="status">{note}</p><button className={s.main} onClick={onFind}>Explore activities</button></section></>;
}
