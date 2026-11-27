"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useTTS } from "@/hooks/use-tts";
import { AnimalPortrait } from "./AnimalPortrait";
import { starter } from "@/lib/explorer-character";
import type { PostGuide } from "@/lib/trading-post";
import w from "./PipWalkthrough.module.css";

const notes = ["The wind blew my hat into the bay.", "Please bring me a new hat."];
type ExampleMode = PostGuide | "hundreds";
const guides: Record<ExampleMode,string[]> = {
  count: ["Here are four shells on my mat. Watch me give one to the basket.", "One shell moved. Three are still on my mat. Four take away one is three.", "Your turn. Tap one shell on the mat to send it to my basket.", "You moved one shell. Three are left. Now try your own order."],
  trade: ["I have twenty-one shells. I need to give away thirteen. Each bundle holds ten shells.", "I open one bundle. Ten loose shells come out. I still have twenty-one.", "One bundle goes to the basket. That is ten.", "Three loose shells go with it. Ten plus three is thirteen. Eight stay on my mat.", "Your turn. Tap a bundle to open it into ten loose shells.", "You made ten ones! The amount is still twenty-one. Try that move in your order."],
  hundreds: ["These two large blocks and one rod are worth two hundred ten. Watch how I pack one hundred thirty.", "I open one hundred into ten tens. I still have two hundred ten.", "I send one hundred to the basket.", "I add three tens. I sent one hundred thirty and have eighty left.", "Your turn. Open one hundred into ten tens.", "You made ten tens and kept the same total. Try that exchange on your own mat."],
  blend: ["Watch how these three letters make a word. Tap Hear the sounds to listen.", "Slide your finger from s to u to n. Blend the sounds together: sun.", "Your turn. Tap the picture that goes with sun.", "Yes, the sun! Now blend the sounds in Pip’s delivery word."],
  note: ["Read this practice note with me. The wind blew my hat into the bay. Please bring me a new hat.", "What should I bring? The note asks for a new hat. I can point to those words to show how I know.", "Your turn. Tap the sentence that tells you what to bring.", "You found the words that answer the question! Now look for a clue in the delivery note."],
};

function Board({early, scale=1, frame, onPick}:{early:boolean;scale?:1|10;frame:number;onPick:()=>void}) {
  const [picked, setPicked] = useState<string | null>(null);
  const tryAt = early ? 2 : 4;
  const trying = frame===tryAt;
  const opened = !early && (frame>0 && frame<tryAt || frame>tryAt);
  const sendBundle = !early && frame>=2 && frame<tryAt;
  const sent = early ? Number(frame===1 || frame===3) : sendBundle ? frame===3?13:10 : 0;
  const initial = early?4:21;
  const pieces: {id:string;size:number;basket:boolean}[] = [];
  if (!early) {
    const openedBundle = frame > tryAt ? picked : "ten-b";
    for (const id of ["ten-a", "ten-b"]) {
      if (!opened || id !== openedBundle) {
        pieces.push({id, size:10, basket:sendBundle && id === "ten-a"});
      }
    }
  }
  for(let i=0;i<(early?4:opened?11:1);i++) {
    const id = "one-" + i;
    const movedShell = frame > tryAt ? picked : "one-0";
    pieces.push({id, size:1, basket:early ? sent===1 && id===movedShell : sent===13 && i<3});
  }
  let left=0,right=0;
  return <div className={w.board} role="group" aria-label={'On the mat: '+((initial-sent)*scale)+'. In the basket: '+(sent*scale)+'.'}>
    <span className={w.matLabel}>Mat · {(initial-sent)*scale}</span><span className={w.basketLabel}>Basket · {sent*scale}</span>
    {pieces.map(piece=>{
      const slot = piece.basket?right++:left++;
      const col=slot%3,row=Math.floor(slot/3);
      const style={left:(piece.basket?55:5)+col*13+"%",top:24+row*18+"%"} as CSSProperties;
      const canPick=trying && (early || piece.size===10);
      const face=piece.size===10?<span className={w.ten}>{10*scale}</span>:scale===10?<span className={w.ten}>10</span>:<span className={w.shell}/>;
      return canPick?<button key={piece.id} className={w.piece} style={style} onClick={() => {setPicked(piece.id); onPick();}} aria-label={early?"Move one shell":scale===10?"Open a hundred":"Open a bundle of ten"}>{face}</button>:
        <span key={piece.id} className={w.piece} style={style} aria-hidden="true">{face}</span>;
    })}
  </div>;
}

type WalkthroughProps = {
  mode: ExampleMode;
  sound: boolean;
  open: boolean;
  onToggle: (open: boolean) => void;
  onHelp: () => void;
};

export function PipWalkthrough({mode, sound, open, onToggle, onHelp}: WalkthroughProps) {
  const opener = useRef<HTMLButtonElement>(null);
  if (!open) return <button className={w.open} ref={opener} onClick={() => {
    onHelp();
    onToggle(true);
  }}><span aria-hidden="true">▶</span> Show me, Pip</button>;
  return <Example mode={mode} sound={sound} onHelp={onHelp} onClose={() => {
    onToggle(false);
    requestAnimationFrame(() => opener.current?.focus());
  }}/>;
}

function Example({mode, sound, onHelp, onClose}: Pick<WalkthroughProps, "mode" | "sound" | "onHelp"> & {onClose: () => void}) {
  const lines=guides[mode];
  const [frame,setFrame]=useState(0);
  const [retry,setRetry]=useState("");
  const [playing,setPlaying]=useState(() => !window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const audio=useRef<HTMLAudioElement>(null);
  const title=useRef<HTMLHeadingElement>(null);
  const tts=useTTS();
  const stopRef=useRef(tts.stop);
  const hasVoice=useRef(false);
  const intro = useRef({ sound, line: lines[0], speak: tts.speakImmediately });
  useEffect(() => {
    if (intro.current.sound) {
      hasVoice.current = true;
      intro.current.speak(intro.current.line, {speed:.84});
    }
    return () => { if (hasVoice.current) stopRef.current(); };
  }, []);
  const helpRef = useRef(onHelp);
  useEffect(() => { helpRef.current = onHelp; }, [onHelp]);
  // Skipping the opening invitation still lets the learner solve independently.
  useEffect(() => { if (frame === 1) helpRef.current(); }, [frame]);
  useEffect(()=>{if(frame===0)title.current?.focus();},[frame]);
  const speakRef=useRef(tts.speakImmediately);
  useEffect(()=>{
    if(!playing || frame>=lines.length-2 || tts.speaking || tts.loading)return;
    const timer=window.setTimeout(()=>{
      const next=frame+1;
      setFrame(next);
      if(sound){hasVoice.current=true;speakRef.current(lines[next],{speed:.84});}
    },sound?2600:4900);
    return ()=>window.clearTimeout(timer);
  },[playing,frame,lines,sound,tts.speaking,tts.loading]);
  function say(line:string) {
    if(!sound)return;
    hasVoice.current=true;
    tts.speakImmediately(line,{speed:.84});
  }
  function move(to:number){
    audio.current?.pause();setRetry("");setFrame(to);say(lines[to]);
  }
  function close(){
    audio.current?.pause();if(hasVoice.current)tts.stop();
    hasVoice.current=false;onClose();
  }
  const practice=frame===lines.length-2;
  const last=frame===lines.length-1;
  function tryAnswer(right:boolean){
    if(!practice)return;
    if(right)move(frame+1);
    else{const line=mode==="blend"?"Look for the sun in the daytime sky.":"Look for the sentence asking for something.";setRetry(line);say(line);}
  }
  return <section className={w.lesson} aria-label="Worked example with Pip">
    <header><h3 ref={title} tabIndex={-1}>{practice?"Try it with Pip":last?"You did it!":"Watch Pip"}</h3><button onClick={close}>I’m ready <span aria-hidden="true">→</span></button></header>
    <div className={w.harbor}>
      <div className={w.pip}><AnimalPortrait look={{...starter,kind:"owl"}} turn={12}/></div>
      {(mode==="count" || mode==="trade" || mode==="hundreds") ? <Board early={mode==="count"} scale={mode==="hundreds"?10:1} frame={frame} onPick={()=>tryAnswer(true)}/> :
        mode==="blend"?<div className={w.paper}>
          <div className={w.word} data-blend={frame>=1} aria-label="s, u, n">{["s","u","n"].map(letter=><span key={letter}>{letter}</span>)}</div>
          {practice?<div className={w.objects}>{["🌙","☀️"].map((symbol,i)=><button key={symbol} aria-label={i?"Sun":"Moon"} onClick={()=>tryAnswer(i===1)}>{symbol}</button>)}</div>:
            frame>0?<span className={w.picture} role="img" aria-label="Sun">☀️</span>:null}
          <audio src="/explorer/sun.mp3" preload="none" ref={audio}/>
          <button onClick={()=>{setPlaying(false);if(hasVoice.current)tts.stop();const clip=audio.current;if(clip){clip.currentTime=0;void clip.play().catch(()=>setRetry("Follow the letters from left to right, then say sun."));}}}>♫ Hear the sounds</button>
        </div>:<div className={w.paper}>
          <span className={w.picture} role="img" aria-label="A hat by the water">👒 🌊</span>
          {notes.map((line,i)=>practice?<button key={line} onClick={()=>tryAnswer(i===1)}>{line}</button>:<p key={line} data-marked={i===1 && frame>0}>{line}</p>)}
        </div>}
    </div>
    <p className={w.caption} aria-live="polite">{retry || lines[frame]}</p>
    <footer>
      {sound && <button onClick={()=>say(retry||lines[frame])} aria-label="Hear Pip again">🔊</button>}
      {!practice && !last && <button onClick={()=>setPlaying(v=>!v)}>{playing?"Ⅱ Pause":"▶ Play"}</button>}
      {frame>0 && <button onClick={()=>move(0)}>↺ Replay</button>}
      {last?<button className={w.next} onClick={close}>Try my problem →</button>:
       !practice && <button className={w.next} onClick={()=>move(frame+1)}>{frame===lines.length-3?"My turn":"Next"} →</button>}
    </footer>
  </section>;
}
