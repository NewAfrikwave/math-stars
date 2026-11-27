"use client";

import {useState} from "react";
import {exchange, shellOrder, split, units, worth, type Unit} from "@/lib/discovery-games";
import {useGameStore} from "@/store/useGameStore";
import {SpeakButton} from "../SpeakButton";
import {PipWalkthrough} from "./PipWalkthrough";
import s from "./Explorer.module.css";
import g from "./DiscoveryGames.module.css";

const names = {100:"hundred",10:"ten",1:"one"};
export function TradingWorkshop({level, fresh, finish}: {level:string;fresh:boolean;finish:(helped:boolean)=>void}) {
  const [start, order] = shellOrder(level,fresh);
  const [stock,setStock] = useState(()=>split(start));
  const [packed,setPacked] = useState(()=>split(0));
  const [help,setHelp] = useState(false);
  const [guide,setGuide] = useState(!fresh);
  const [message,setMessage] = useState("");
  const [answer,setAnswer] = useState("");
  const sound = useGameStore(st=>st.soundOn);
  const need = split(order);
  const total = worth(stock);
  const target = [...units].reverse().find(unit=>packed[unit]<need[unit]);
  const short = target && stock[target] < need[target]-packed[target];
  const opening = target === 10 ? 100 : 10;
  const cue = !target ? "How many shells are left on your mat?" : short ?
    "Open one "+names[opening]+" to get ten "+names[target]+"s." :
    "Send "+(need[target]-packed[target])+" more "+names[target]+(need[target]-packed[target]===1?"":"s")+" to Pip.";
  function touch(unit:Unit) {
    if (!target) return;
    const smaller = unit===100 ? 10 : 1;
    if (unit!==1 && stock[smaller] < need[smaller]-packed[smaller]) {
      setStock(exchange(stock,unit));
      setMessage("You traded one "+names[unit]+" for ten "+names[smaller]+"s. You still have "+total+" shells!");
    } else if (packed[unit] < need[unit]) {
      setStock({...stock,[unit]:stock[unit]-1});
      setPacked({...packed,[unit]:packed[unit]+1});
      setMessage("");
    } else {
      setMessage(cue);
      setHelp(true);
    }
  }
  return <section className={s.card}><h1>Pip’s Trading Workshop</h1>
    <h2>{fresh?"Your own order":"Pack an order with Pip"}</h2>
    <PipWalkthrough mode={start>=100?"hundreds":start<10?"count":"trade"} open={guide} onToggle={setGuide} sound={sound} onHelp={()=>setHelp(true)}/>
    <div hidden={guide}>
      <div className={g.invoice}><span>Pip’s shell order</span><strong>{start} − {order}</strong></div>
      <p>{fresh && target?"Tap the blocks to pack Pip’s order. Open a larger block if you need change.":cue}</p>
      {sound && <SpeakButton text={"You have "+start+" shells. Pack "+order+" for Pip. "+(fresh?"Use the blocks to make the order.":cue)} label="Listen to Pip"/>}
      <div className={g.workbench}><h3>Your shell mat</h3>
        {units.filter(u=>start>=u).map(u=><section key={u} className={g.bin}><strong>{names[u]}s · {stock[u]}</strong><div className={g.tokens}>
          {Array.from({length:stock[u]},(_,i)=><button key={i} className={g.token} disabled={!target} aria-label={names[u]+" block "+(i+1)} onClick={()=>touch(u)}><i data-unit={u}>{u===1?"●":u}</i></button>)}
        </div></section>)}
      </div>
      <p className={g.basket}>Pip’s basket · {worth(packed)} of {order}</p>
      <div role="status">{message && <p className={s.feedback}>{message}</p>}</div>
      {target && fresh && <button className={s.back} onClick={()=>{setHelp(true);setMessage(cue);}}>Give me a clue</button>}
      {!target && <form onSubmit={e=>{e.preventDefault();if(Number(answer)===start-order)finish(help);else{setHelp(true);setMessage("Count the hundreds, tens and ones left on your mat. Then try again.");}}}>
        <label>Shells left <input className={s.input} value={answer} onChange={e=>setAnswer(e.target.value)} inputMode="numeric" pattern="[0-9]+" required/></label> <button className={s.main}>Check my count</button>
      </form>}
    </div>
  </section>;
}
