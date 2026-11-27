"use client";

import {useState} from "react";
import {discoveries,shellOrder,type Discovery} from "@/lib/discovery-games";
import {type Journal} from "@/lib/explorer";
import {AnswerCheer} from "../AnswerCheer";
import {record} from "./journal";
import {TradingWorkshop} from "./TradingWorkshop";
import {ReefDetectives} from "./ReefDetectives";
import s from "./Explorer.module.css";

type Props={game:Discovery;profile:string;day:string;level:string;entries:Journal;onRoom:()=>void};
export function DiscoveryGame({game,profile,day,level,entries,onRoom}:Props) {
  const key=["mission",day,level,game].join("/");
  const [fresh,setFresh]=useState(()=>!!entries[key+"/guided"] && !entries[key+"/fresh"]);
  const [done,setDone]=useState(false);
  const {title,icon,sticker}=discoveries[game];
  function finish(helped:boolean) {
    if (done) return;
    const result=helped || !fresh?"helped":"solo";
    const skill=game==="reef"?"evidence":level==="preschool"?"taking":fresh?"transfer":"exchange";
    const pairs:[string,string][]=[[key+(fresh?"/fresh":"/guided"),"done"],["skill/"+day+"/"+skill+"/"+result,"seen"]];
    if(fresh) pairs.push(["stamp/"+game,"earned"]);
    void record(profile,pairs);
    setDone(true);
  }
  const [start,take]=shellOrder(level,fresh);
  if(done)return <section className={s.card}><h1>{title}</h1><h2>{fresh?icon+" "+sticker+" sticker earned!":"Ready for a new challenge?"}</h2>
    <AnswerCheer turn={Number(fresh)}>{game==="reef"?"You linked what you saw to words in the field note.":"You packed "+take+" shells from "+start+" and found "+(start-take)+" left."}</AnswerCheer>
    <div className={s.choices}><button className={s.main} onClick={()=>{if(fresh)onRoom();else{setFresh(true);setDone(false);}}}>{fresh?"Put it in my room":game==="reef"?"Investigate a new field note":"Try a fresh order"}</button></div></section>;
  return game==="reef"?<ReefDetectives key={String(fresh)} level={level} fresh={fresh} finish={finish}/>:<TradingWorkshop key={String(fresh)} level={level} fresh={fresh} finish={finish}/>;
}
