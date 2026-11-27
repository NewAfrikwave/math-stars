"use client";
import { dayKey,outcomes,skillInfo } from "@/lib/explorer";
import { postTakeaway } from "@/lib/trading-post";
import { useJournal } from "./journal";
import s from "./Explorer.module.css";

export function FamilyRecap({profile,name}:{profile:string;name:string}) {
  const {entries,status,ready,refresh}=useJournal(profile);
  const start=new Date();start.setDate(start.getDate()-6);
  const post=postTakeaway(entries,dayKey(start));
  const latest=Object.entries(outcomes(entries,undefined,dayKey(start))).sort((a,b)=>b[1].at-a[1].at);
  const completed=latest.filter(([,e])=>e.kind==="solo");
  const helped=latest.filter(([,e])=>e.kind==="helped");
  const working=latest.filter(([,e])=>e.kind==="hint");
  const sections=[
    {title:"Did independently",rows:completed},
    {title:"Did with help",rows:helped},
    {title:"Started with a clue",rows:working}
  ];
  const next=latest.find(([,e])=>e.kind!=="solo");
  return <article className={s.recap}><h2>{name}’s practice recap</h2><p>Last seven days in School Practice and the explorer activities. Each skill shows the most recent attempt.</p>
    {!ready?<p role="status">Opening practice records…</p>:<>
      {post && <section><h3>Pip’s Trading Post</h3><p>{post}</p></section>}
      {sections.map(({title,rows})=>{
        return <section key={title}><h3>{title}</h3>{rows.length?<ul>{rows.map(([id])=><li key={id}>{skillInfo(id)?.[0]}</li>)}</ul>:<p>No attempts in this category yet.</p>}</section>;
      })}
      <section><h3>Try next</h3><p>{next?skillInfo(next[0])?.[1]:latest.length?"Revisit the most recent skill. "+(skillInfo(latest[0][0])?.[1]??"Ask your child to explain their thinking."):"Try a stop on the daily discovery path to see the first skill here."}</p></section>
    </>}
    {status!=="saved" && ready && <p role="status">Showing practice available on this device. <button className={s.back} onClick={()=>void refresh()}>Refresh family progress</button></p>}
  </article>;
}
