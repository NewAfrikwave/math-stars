"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, Check, ChevronRight } from "lucide-react";
import { useGameStore } from "@/store/useGameStore";
import { loadSnapshot, saveSnapshot } from "@/lib/offline/database";
import { Adventure, activityFor, stickers } from "./workshop/Adventure";
import { SpeakButton } from "./SpeakButton";
import { lessons, type SchoolLesson } from "@/lib/school-practice";

const subjects = ["Math", "Reading", "Science", "Kindness"] as const;
const button = "rounded-xl border px-4 py-3 font-semibold focus-visible:outline-4";
const primary = button + " bg-emerald-800 text-white hover:bg-emerald-900";
const panel = "rounded-3xl border bg-card p-5 shadow-sm sm:p-8";

export function SchoolPractice() {
  const profile = useGameStore(state => state.currentProfileId);
  return profile ? <LearningPath key={profile} profile={profile} /> : null;
}

function LearningPath({ profile }: { profile: string }) {
  const home = useGameStore(state => state.setView);
  const [subject, setSubject] = useState<SchoolLesson["subject"]>("Math");
  const [active, setActive] = useState<SchoolLesson | null>(null);
  const [album,setAlbum] = useState<string[]>([]);
  const worldsEnabled = useGameStore(state => state.siteSettings?.manipulativesEnabled !== false);
  const [done, setDone] = useState<string[]>([]);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    let current = true;
    Promise.all(lessons.map(async lesson => await loadSnapshot<boolean>(`school-sticker:${profile}:${lesson.id}`) ? lesson.id : "" ))
      .then(ids => { if(current) setAlbum(previous => [...new Set([...previous,...ids.filter(Boolean)])]); })
      .catch(() => { if(current) setSaveError(true); });
    Promise.all(lessons.map(async lesson => {
      const finished = await loadSnapshot<boolean>(`school-practice:${profile}:${lesson.id}`);
      return finished === true ? lesson.id : "";
    })).then(ids => {
      if (current) setDone(previous => [...new Set([...previous, ...ids.filter(Boolean)])]);
    }).catch(() => { if (current) setSaveError(true); });
    return () => { current = false; };
  }, [profile]);

  function finish(id: string) {
    setDone(previous => previous.includes(id) ? previous : [...previous, id]);
    saveSnapshot(`school-practice:${profile}:${id}`, true).catch(() => setSaveError(true));
  }
  function collect(id: string) {
    setAlbum(previous=>previous.includes(id)?previous:[...previous,id]);
    saveSnapshot(`school-sticker:${profile}:${id}`,true).catch(()=>setSaveError(true));
  }
  const visible = lessons.filter(lesson => lesson.subject === subject);
  const nextLesson = visible.find(lesson => !done.includes(lesson.id));
  return (
    <section className="mx-auto max-w-3xl space-y-5 px-4 py-6">
      <button className={button} onClick={() => active ? setActive(null) : home({ name: "home" })}>
        <ArrowLeft className="mr-2 inline size-4" />{active ? "School Practice" : "Home"}
      </button>
      {saveError && <p role="status">Device storage is unavailable. You can keep practicing this visit.</p>}
      {active ? <Lesson key={active.id} lesson={active} onFinish={() => finish(active.id)} onStamp={() => collect(active.id)} onBack={() => setActive(null)} /> : <>
        <header className={panel}>
          <BookOpen className="mb-3 text-emerald-700" />
          <h1 className="font-display text-3xl font-bold">School Practice</h1>
          <p className="mt-2">Choose an adventure, then try what you learned on your own.</p>
        </header>
        {worldsEnabled && <details className="rounded-2xl border bg-amber-50 p-4 text-amber-950">
          <summary className="cursor-pointer font-bold">My sticker book · {album.length} / {lessons.length}</summary>
          {album.length ? <ul className="mt-3 flex flex-wrap gap-2">{lessons.filter(l=>album.includes(l.id)).map(l=>{
            const activity=activityFor(l.id);
            return <li key={l.id} className="rounded-xl bg-white px-3 py-2 text-sm">{activity && stickers[activity.world]} {l.id.startsWith("blend-")?l.title:activity?.title}</li>;
          })}</ul> : <p className="mt-2">Finish the challenges in an adventure to collect its sticker.</p>}
        </details>}
        <div aria-label="Choose a subject" role="group" className="flex flex-wrap gap-2">
          {subjects.map(item => <button key={item} aria-pressed={item === subject} className={item === subject ? primary : button} onClick={() => setSubject(item)}>{item}</button>)}
        </div>
        <h2 className="text-lg font-semibold">{subject} · {visible.filter(item => done.includes(item.id)).length} of {visible.length} finished on this device</h2>
        {nextLesson && worldsEnabled && <button onClick={()=>setActive(nextLesson)} className="w-full rounded-2xl bg-emerald-800 p-4 text-left font-bold text-white">
          Continue my {subject.toLowerCase()} path <ChevronRight className="inline size-5"/>
          <span className="mt-1 block text-sm font-normal">{nextLesson.title}</span>
        </button>}
        <ol className="grid gap-3 sm:grid-cols-2">{visible.map(lesson => <li key={lesson.id}>
          <button className="flex h-full w-full items-center gap-3 rounded-2xl border bg-card p-4 text-left font-semibold shadow-sm hover:border-emerald-700" onClick={() => setActive(lesson)}>
            {worldsEnabled && activityFor(lesson.id) && <span aria-hidden="true" className="text-3xl">{stickers[activityFor(lesson.id)!.world]}</span>}
            <span className="flex-1">{worldsEnabled && activityFor(lesson.id) ? <><strong className="block">{activityFor(lesson.id)!.title}</strong><small>{lesson.title}</small></> : lesson.title}</span>
            {done.includes(lesson.id) && <span className="text-sm"><Check className="inline size-4" /> Finished</span>}
            <ChevronRight className="size-5" />
          </button>
        </li>)}</ol>
      </>}
    </section>
  );
}

function PlaceValueTrade() {
  const [traded, setTraded] = useState(false);
  const tens = traded ? 5 : 6;
  const ones = traded ? 12 : 2;
  return <div className="space-y-3 rounded-xl border p-4">
    <p className="font-bold">Make enough ones to take away 7.</p>
    <p aria-live="polite">4 hundreds + {tens} tens + {ones} ones = 462</p>
    <div className="flex flex-wrap gap-4" aria-hidden="true">
      <div className="flex items-end gap-1">{Array.from({ length: tens }, (_, i) =>
        <span key={i} className="h-12 w-2 rounded-sm bg-teal-700" />)}</div>
      <div className="grid grid-cols-5 content-end gap-1">{Array.from({ length: ones }, (_, i) =>
        <span key={i} className="size-2 rounded-sm bg-amber-600" />)}</div>
    </div>
    <button className={button} onClick={() => setTraded(!traded)}>{traded ? "Put the ten back" : "Trade 1 ten for 10 ones"}</button>
  </div>;
}

function AdditionHops() {
  const stops = [268, 368, 418, 424];
  const jumps = [100, 50, 6];
  const [index, setIndex] = useState(0);
  return <div className="space-y-3 rounded-xl border p-4">
    <p className="font-bold">Hop through 268 + 156</p>
    <p aria-live="polite" className="font-display text-xl">{stops.slice(0, index + 1).join(" → ")}</p>
    <button className={button} onClick={() => setIndex(index === jumps.length ? 0 : index + 1)}>
      {index === jumps.length ? "Start the hops again" : "Hop +" + jumps[index]}
    </button>
  </div>;
}

function Lesson({ lesson, onFinish, onBack, onStamp }: { lesson: SchoolLesson; onFinish: () => void; onBack: () => void; onStamp: () => void }) {
  const worldsEnabled = useGameStore(s=>s.siteSettings?.manipulativesEnabled !== false);
  const [step, setStep] = useState(-1);
  const [entry, setEntry] = useState("");
  const [feedback, setFeedback] = useState("");
  const [correct, setCorrect] = useState(false);
  const [hint, setHint] = useState(false);
  const [draft, setDraft] = useState("");
  const [review, setReview] = useState(false);
  const [finished, setFinished] = useState(false);
  const [missed, setMissed] = useState<number[]>([]);
  const [feeling, setFeeling] = useState("");
  const [round, setRound] = useState(0);
  const q = lesson.checks[step];
  const writing = lesson.writing;
  const speaking = useGameStore(state => state.soundOn);

  function next() {
    setStep(step + 1);
    setEntry(""); setFeedback(""); setCorrect(false); setHint(false);
    if (step + 1 >= lesson.checks.length && !writing) complete();
  }
  function complete() {
    setFinished(true);
    onFinish();
  }
  function submit(value: string) {
    if (!value.trim() || correct) return;
    const right = q.alternatives.length
      ? value.trim() === q.answer
      : /^\d+$/.test(value.trim()) && Number(value) === Number(q.answer);
    setCorrect(right);
    if (!right) {
      setMissed(previous => previous.includes(step) ? previous : [...previous, step]);
      setHint(true);
    }
    setFeedback(right ? q.why : "Try again. " + q.hint);
  }

  const example = <div className="space-y-3 rounded-xl bg-muted p-4">
    <p>{lesson.example}</p>
    {lesson.model && <table className="w-full table-fixed text-center text-sm"><thead>
      <tr>{lesson.model.labels.map(label => <th key={label} scope="col" className="p-1">{label}</th>)}</tr>
    </thead><tbody><tr>{lesson.model.values.map((value, i) => <td key={i} className="border-t p-1 font-bold">{value}</td>)}</tr></tbody></table>}
  </div>;

  return <article className={panel + " space-y-5"}>
    <h1 className="font-display text-2xl font-bold">{lesson.title}</h1>
    {finished ? <>
      <h2 className="text-xl font-semibold">Lesson finished!</h2>
      <p>{missed.length ? "You worked through the tricky parts. Try another round when you are ready." : "You answered every practice question on your first try."}</p>
      <fieldset className="space-y-2"><legend className="font-semibold">How did that feel?</legend>
        <div className="flex flex-wrap gap-2">{["Still tricky", "Getting there", "I feel ready"].map(item =>
          <button key={item} aria-pressed={item === feeling} className={item === feeling ? primary : button} onClick={() => setFeeling(item)}>{item}</button>)}</div>
        {feeling && <p role="status">{feeling === "Still tricky" ? "Pick one example to explain with a grown-up. You can try again together." : feeling === "Getting there" ? "Try explaining one step in your own words." : "Choose another lesson when you are ready."}</p>}
      </fieldset>
      <div className="flex flex-wrap gap-2"><button className={primary} onClick={onBack}>Choose a lesson</button>
        <button className={button} onClick={() => { setStep(-1); setFinished(false); setFeeling(""); setMissed([]); setDraft(""); setReview(false); setRound(round + 1); }}>Practice again</button></div>
    </> : step < 0 ? <>
      {worldsEnabled && <Adventure key={round} lesson={lesson} onPractice={next} onStamp={onStamp}/>}
      <h2 className="text-xl font-semibold">Work through an example</h2>{example}
      {!worldsEnabled && lesson.id === "subtract" && <PlaceValueTrade />}
      {!worldsEnabled && lesson.id === "addition" && <AdditionHops />}
      {speaking && <SpeakButton text={[lesson.example, ...(lesson.model?.labels.map((label, i) => label + ", " + lesson.model?.values[i]) ?? [])].join(". ")} label="Hear example" />}
      <div><button className={primary} onClick={next}>Try it with help</button></div>
    </> : q ? <div key={step} className="space-y-4">
      <p className="font-semibold text-muted-foreground">{step === 0 ? "Guided practice" : "Your turn"} · {step + 1} of {lesson.checks.length}</p>
      {(step === 0 || lesson.subject === "Reading" || lesson.model && lesson.subject === "Science") ? example : <details><summary className="cursor-pointer font-semibold">See the example</summary>{example}</details>}
      <h2 className="text-xl font-bold">{q.prompt}</h2>
      {speaking && <SpeakButton text={[q.prompt, ...(q.alternatives.length ? orderedChoices() : [])].join(". ")} label="Hear question" />}
      {step === 0 && <p className="rounded-xl bg-muted p-3">{q.hint}</p>}
      {q.alternatives.length ? <div className="grid gap-2">{orderedChoices().map(choice =>
        <button key={choice} disabled={correct} className={button + " text-left disabled:opacity-80"} onClick={() => submit(choice)}>{choice}</button>
      )}</div> : <form className="flex flex-wrap gap-2" onSubmit={e => { e.preventDefault(); submit(entry); }}>
        <input aria-label="Your numerical answer" className="w-32 rounded-xl border bg-background p-3" inputMode="numeric" value={entry} disabled={correct} onChange={e => setEntry(e.target.value)} />
        <button className={primary} disabled={correct || !entry.trim()}>Check answer</button>
      </form>}
      {step > 0 && !correct && <button className={button} onClick={() => setHint(true)}>Show a hint</button>}
      <p role="status" className="font-semibold">{feedback || (hint ? q.hint : "")}</p>
      {correct && <button className={primary} onClick={next}>Continue</button>}
    </div> : writing && <>
      {example}
      <label className="block text-xl font-bold" htmlFor="school-response">{writing.prompt}</label>
      <textarea id="school-response" className="min-h-28 w-full rounded-xl border bg-background p-3" value={draft} onChange={e => setDraft(e.target.value)} />
      {review ? <div className="space-y-3">
        <p><strong>Check your work. </strong>{writing.lookFor}</p>
        <p><strong>One possible answer. </strong>{writing.sample}</p>
        <button className={primary} disabled={!draft.trim()} onClick={complete}>I reviewed my answer</button>
      </div> : <button className={primary} disabled={!draft.trim()} onClick={() => setReview(true)}>Review my writing</button>}
    </>}
  </article>;

  function orderedChoices() {
    const options = [...q.alternatives];
    options.splice((step + lesson.id.length + round) % (options.length + 1), 0, q.answer);
    return options;
  }
}
