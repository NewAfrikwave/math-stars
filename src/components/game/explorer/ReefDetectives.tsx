"use client";

import {useState, type CSSProperties} from "react";
import {useGameStore} from "@/store/useGameStore";
import {SpeakButton} from "../SpeakButton";
import {AnswerCheer} from "../AnswerCheer";
import s from "./Explorer.module.css";
import g from "./DiscoveryGames.module.css";

function reefNote(early:boolean,fresh:boolean) {
  if (fresh) return {
    lines:early?["A bit of food floats by.","The coral pulls food to its mouth.","A fish swims past."]:
      ["Tiny animals drift through the dark water.","A polyp catches a tiny animal and draws it toward its mouth.","A fish glides over the reef."],
    question:"How does the polyp get its food?", choices:["It chases a fish.","It eats the rock.","It pulls food toward its mouth."],
    answer:2, evidence:1, hint:"Look for what the polyp does after food drifts close."
  };
  return {
    lines:early?["In the day, the coral looks bumpy.","A fish swims by.","At night, the coral stretches out its tentacles."]:
      ["By day, the star coral looks like a mound of small bumps.","A striped fish passes the mound.","After dark, thin tentacles reach out from the coral polyps."],
    question:"What changed when night came?", choices:["The coral stretched out its tentacles.","The rock swam away.","The fish turned into coral."],
    answer:0,evidence:2,hint:"Watch the little arms on the coral as day turns to night."
  };
}

export function ReefDetectives({level,fresh,finish}:{level:string;fresh:boolean;finish:(helped:boolean)=>void}) {
  const note=reefNote(level==="preschool" || level==="grade1",fresh);
  const [night,setNight]=useState(false);
  const [observed,setObserved]=useState(false);
  const [fed,setFed]=useState(false);
  const [clue,setClue]=useState(false);
  const [help,setHelp]=useState(false);
  const [feedback,setFeedback]=useState("");
  const sound=useGameStore(st=>st.soundOn);
  const ready=fresh?fed:observed;
  function choose(i:number) {
    if (i!==(clue?note.evidence:note.answer)) {
      setHelp(true); setFeedback(clue?"Read the sentence again. Which words tell you how you know?":note.hint); return;
    }
    if (clue) finish(help);
    else {setClue(true);setFeedback("");}
  }
  const question=clue?"Which sentence helped you know?":note.question;
  return <section className={s.card}><h1>Coral Reef Detectives</h1><h2>{fresh?"The midnight meal":"A reef after dark"}</h2>
    <div className={g.reef} data-night={night} data-fed={fed && night} role="img" aria-label={night?(fed?"A coral polyp draws food into its mouth.":"The coral polyps stretch their tentacles into the water."):"In daylight the coral looks like a mound of bumps."}>
      <div className={g.water} style={{backgroundImage:"url(/explorer/reef-lagoon.webp)"}}/><div className={g.colony}>{[0,1,2,3,4].map((n)=><i className={g.polyp} key={n}>{Array.from({length:10},(_,k)=><b key={k} style={{"--angle":k*36+"deg"} as CSSProperties}/>)}</i>)}</div>
      {fresh && night && <span className={g.plankton} aria-hidden="true">✧</span>}
      <strong className={g.light}>{night?"☾ Night":"☀ Day"}</strong>
    </div>
    <div className={s.choices}><button className={s.choice} aria-pressed={!night} onClick={()=>setNight(false)}>☀ Day</button>
      <button className={s.choice} aria-pressed={night} onClick={()=>{setNight(true);setObserved(true);}}>☾ Night</button>
      {fresh && night && <button className={s.main} onClick={()=>setFed(true)} disabled={fed}>Float food past the coral</button>}</div>
    <div className={s.passage}>{note.lines.map(line=><p key={line}>{line}</p>)}</div>
    {sound && <SpeakButton label="Read the field note" text={note.lines.join(" ")}/>}
    {!ready?<p>{night?"Float a bit of food past the coral.":"Switch to night and watch the coral."}</p>:<>
      {clue && <AnswerCheer>You spotted what the polyp did!</AnswerCheer>}
      <h3>{question}</h3>{sound && <SpeakButton label="Hear the question and choices" text={[question,...(clue?note.lines:note.choices)].join(" ")}/>}
      <div className={s.proof}>{(clue?note.lines:note.choices).map((line,i)=><button className={s.choice} key={line} onClick={()=>choose(i)}>{line}</button>)}</div>
    </>}
    <p role="status">{feedback}</p>
  </section>;
}
