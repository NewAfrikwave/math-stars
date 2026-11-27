"use client";

import { AnswerCheer } from "@/components/game/AnswerCheer";

import { useState } from "react";
import { bookKey, bookSets, nextUnread, pages, setFinished, storyHelpers, type BookSet, type LittleBook, type Page } from "@/lib/decodable-books";
import { dayKey, type Journal } from "@/lib/explorer";
import { useGameStore } from "@/store/useGameStore";
import { SpeakButton } from "../SpeakButton";
import { record } from "./journal";
import styles from "./Explorer.module.css";
import shelf from "./Bookshelf.module.css";

interface Props {
  profile:string;
  entries:Journal;
  openActivity:(trail:"sounds"|"read")=>void;
}
export function Bookshelf({profile,entries,openActivity}:Props) {
  const [open,setOpen]=useState<LittleBook|null>(null);
  const has=(key:string)=>!!entries[key];
  const recommended=nextUnread(has);
  const setsComplete=bookSets.filter(set=>setFinished(set,has)).length;
  if(open) {
    const set=bookSets.find(item=>item.books.includes(open))!;
    return <Reader key={open.id} profile={profile} set={set} book={open} entries={entries}
      close={()=>setOpen(null)} advance={recommended && recommended.id!==open.id?()=>setOpen(recommended):undefined}/>;
  }
  return <>
    <header className={shelf.cover}><div><span>Reading &amp; phonics</span><h1>My little bookshelf</h1>
      <p>{recommended?"Build a word, read a short story, then find the sentence that answers a question.":"You finished every book. Pick a favorite to read again."}</p>
      {recommended&&<button className={styles.main} onClick={()=>setOpen(recommended)}>Read {recommended.title}</button>}
    </div><div className={shelf.books} aria-hidden="true"><i>a</i><i>sh</i><i>ck</i></div></header>
    <section className={styles.card}><h2>Sound sets</h2><p>{setsComplete} of {bookSets.length} sets finished</p>
      {bookSets.map(set=><details className={shelf.set} key={set.id} open={set.books.includes(recommended!) || undefined}>
        <summary><span aria-hidden="true">{set.icon}</span> {set.name}<small>{set.books.filter(b=>has(bookKey(b.id,"evidence"))).length} / {set.books.length}</small></summary>
        <div className={shelf.titles}>{set.books.map(b=><button className={styles.choice} key={b.id} onClick={()=>setOpen(b)}>
          {b.title}<small>{has(bookKey(b.id,"evidence"))?"✓ Read again":has(bookKey(b.id,"word"))?"Continue reading":"Open book"}</small></button>)}</div>
      </details>)}
    </section>
    <section className={styles.card}><h2>More reading games</h2><div className={styles.choices}>
      <button className={styles.choice} onClick={()=>openActivity("sounds")}>Sound Studio</button>
      <button className={styles.choice} onClick={()=>openActivity("read")}>Story Detectives</button>
    </div></section>
  </>;
}

function Reader({profile,set,book,entries,close,advance}:{
  profile:string;set:BookSet;book:LittleBook;entries:Journal;close:()=>void;advance?:()=>void;
}) {
  const sound=useGameStore(s=>s.soundOn);
  const [step,move]=useState(()=>{
    if(entries[bookKey(book.id,"evidence")]) return 0;
    return pages.findIndex(page=>!entries[bookKey(book.id,page)]);
  });
  const page=pages[step];
  const [replay]=useState(()=>!!entries[bookKey(book.id,"evidence")]);
  const [built,build]=useState<string[]>([]);
  const [assisted,setAssisted]=useState(()=>!replay && entries["bookhelp/"+book.id+"/"+pages[step]]?.value==="yes");
  const [correct,setCorrect]=useState(false);
  const [feedback,setFeedback]=useState("");
  const [hint,setHint]=useState(false);
  const skill=page==="word"?"pattern-"+set.id:page==="meaning"?"meaning":"evidence";
  const kind=(outcome:string)=>"skill/"+dayKey()+"/"+skill+"/"+outcome;
  const aidKey="bookhelp/"+book.id+"/"+page;
  function help() {
    if(correct || !page)return;
    if(!assisted)void record(profile,[[kind("hint"),"seen"],[aidKey,"yes"]]);
    setAssisted(true);
  }
  function solve(message:string) {
    setCorrect(true);
    setFeedback(message);
    void record(profile,[[kind(assisted?"helped":"solo"),"seen"],[bookKey(book.id,page),"done"],[aidKey,"no"]]);
  }
  function addTile(tile:string) {
    if(correct)return;
    if(tile!==book.tiles[built.length]){
      help();setHint(true);setFeedback("Listen to the word again, then try the next tile.");return;
    }
    const updated=[...built,tile];build(updated);setFeedback("");
    if(updated.length===book.tiles.length)solve("You built "+book.word+". Read it from left to right.");
  }
  function choose(choice:string) {
    if(correct)return;
    const answer=page==="meaning"?book.choices[0]:book.lines[book.proof];
    if(choice===answer) solve(page==="meaning"?"Yes. Now look for the words that show how you know.":"That sentence supports your answer.");
    else {help();setHint(true);setFeedback("Read the story again and try another "+(page==="meaning"?"answer.":"sentence."));}
  }
  function next() {
    const nextStep=step+1;
    move(nextStep);setCorrect(false);setHint(false);setFeedback("");
    setAssisted(!replay && entries["bookhelp/"+book.id+"/"+pages[nextStep]]?.value==="yes");
  }
  // Change option positions between books while keeping each story stable on a retry.
  const seed=Array.from(book.id).reduce((a,c)=>a+c.charCodeAt(0),0);
  function rotate(items:string[]) {
    const shift=seed%items.length;
    return [...items.slice(shift),...items.slice(0,shift)];
  }
  return <article className={styles.card}>
    <button className={styles.back} onClick={close}>My bookshelf</button>
    <div className={shelf.title}><span>{set.icon} {set.name}</span><h1>{book.title}</h1></div>
    {page && <p className={styles.note}>Step {step+1} of 3 · {["Build the word","Read for meaning","Find the evidence"][step]}</p>}
    {page==="word"&&<>
      <p>Look at <strong>{set.example}</strong>. Practice the sound of <strong>{set.mark}</strong> in this word.</p>
      {sound && <SpeakButton text={set.example} label={"Hear "+set.example}/>}
      <h2>Build the word <em>{book.word}</em></h2>
      {sound && <SpeakButton text={book.word} label="Hear my word"/>}
      <div className={shelf.tiles} aria-label={"Word so far: "+(built.join("")||"empty")}>
        {book.tiles.map((_,i)=><span key={i}>{built[i]||"·"}</span>)}</div>
      <div className={styles.choices}>{rotate([...new Set([...book.tiles,book.distractor])].sort()).map(tile=>
        <button className={styles.choice} aria-label={"Add "+tile} disabled={correct} key={tile} onClick={()=>addTile(tile)}>{tile}</button>)}</div>
    </>}
    {(page==="meaning" || page==="evidence")&&<>
      {page==="meaning"?<div className={shelf.paper}>{book.lines.map(line=><p key={line}>{line}</p>)}</div>:
        <p className={styles.passage}><strong>{book.question}</strong><br/>{book.choices[0]}</p>}
      {sound && <span onClickCapture={help}><SpeakButton text={book.lines.join(" ")} label="Read the story with me"/></span>}
      {sound && page==="meaning" && <details className={shelf.helpers}><summary>Help me read a word</summary>
        <div className={styles.choices}>{storyHelpers(book).map(word=><span key={word} onClickCapture={help}>
          <SpeakButton text={word} label={word}/></span>)}</div></details>}
      <h2>{page==="meaning"?book.question:"Tap the sentence that gives you the clue."}</h2>
      {sound && <SpeakButton text={page==="meaning"?book.question:"Which sentence gives you the clue?"} label="Hear the question"/>}
      <div className={styles.proof}>{(page==="meaning"?rotate(book.choices):book.lines).map(choice=>
        <button key={choice} className={styles.choice} disabled={correct} onClick={()=>choose(choice)}>{choice}</button>)}</div>
    </>}
    {page ? <>
      {!correct && <button className={styles.back} onClick={()=>{help();setHint(true);}}>Give me a clue</button>}
      {hint && !correct && <p className={styles.feedback}>{page==="word"?"Look for the next part: "+book.tiles[built.length]:page==="meaning"?"Reread this part: "+book.lines[book.proof]:"Which line tells what happened, where it happened, or why?"}</p>}
      <p role="status">{correct ? <AnswerCheer turn={seed + step}>{feedback}</AnswerCheer> : feedback}</p>
      {correct && <button className={styles.main} onClick={next}>{page==="evidence"?"Finish my book":"Turn the page"}</button>}
    </>:<>
      <h2>Book finished!</h2>
      <p>You built <strong>{book.word}</strong> and found the words that support your answer.</p>
      {setFinished(set,key=>!!entries[key])&&<p>{set.icon} Your {set.name} sticker is in your explorer room.</p>}
      <div className={styles.choices}>{advance && <button className={styles.main} onClick={advance}>Read my next book</button>}
      <button className={styles.choice} onClick={close}>Choose a book</button></div>
    </>}
  </article>;
}
