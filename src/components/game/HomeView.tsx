"use client";

import Image from "next/image";
import { useRef, useState, type ReactNode } from "react";
import { ArrowRight, BookOpen, Calculator, ChevronRight, CloudDownload, Flame, Gift, Map, Menu, Printer, RefreshCcw, Settings, ShieldQuestion, Sparkles, Star, Trophy, Users, Volume2, VolumeX, X } from "lucide-react";
import { CURRICULUM } from "@/lib/curriculum";
import { PRESCHOOL_CURRICULUM } from "@/lib/preschool";
import { GRADE1_CURRICULUM } from "@/lib/grade1";
import { GRADE2_CURRICULUM } from "@/lib/grade2";
import { GRADE4_CURRICULUM } from "@/lib/grade4";
import { chooseNextMission } from "@/lib/next-mission";
import { clearOfflineDeviceData } from "@/lib/offline/database";
import { useGameStore, useOverallProgress } from "@/store/useGameStore";
import styles from "../HomeWorld.module.css";

const curricula = { preschool: PRESCHOOL_CURRICULUM, grade1: GRADE1_CURRICULUM, grade2: GRADE2_CURRICULUM, grade3: CURRICULUM, grade4: GRADE4_CURRICULUM };
const gradeLabels = { preschool: "Preschool", grade1: "Grade 1", grade2: "Grade 2", grade3: "Grade 3", grade4: "Grade 4" };

export function HomeView() {
  const setView = useGameStore(s => s.setView);
  const level = useGameStore(s => s.level) ?? "grade3";
  const name = useGameStore(s => s.studentName);
  const stars = useGameStore(s => s.totalStars);
  const streak = useGameStore(s => s.streak);
  const reward = useGameStore(s => s.reward);
  const checkpoint = useGameStore(s => s.activeCheckpoint);
  const progress = useGameStore(s => s.progress);
  const soundOn = useGameStore(s => s.soundOn);
  const setSoundOn = useGameStore(s => s.setSoundOn);
  const setCurrentProfile = useGameStore(s => s.setCurrentProfile);
  const settings = useGameStore(s => s.siteSettings);
  const overall = useOverallProgress();
  const dialog = useRef<HTMLDialogElement>(null);
  const [logoutError, setLogoutError] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const curriculum = curricula[level];
  const next = chooseNextMission(curriculum, progress, checkpoint?.lessonId);
  const resume = checkpoint?.lessonId === next.lesson.id ? checkpoint : null;
  const openMission = () => setView(resume
    ? { name: "practice", lessonId: next.lesson.id, difficulty: resume.difficulty }
    : { name: "lesson", lessonId: next.lesson.id });
  function switchLearner() {
    setCurrentProfile(null);
    setView({ name: "landing" });
  }
  async function signOut() {
    setSigningOut(true);
    try {
      const result = await fetch("/api/auth/logout", { method: "POST" });
      if (!result.ok) throw Error();
      await clearOfflineDeviceData().catch(() => {});
      window.location.assign("/");
    } catch {
      setLogoutError("Could not sign out. Check your connection and try again.");
      setSigningOut(false);
    }
  }

  return <div className={styles.page}>
    <div className={styles.wrap}>
      <header className={styles.learnerHeader}>
        <Image src="/brand/math-stars-logo.png" alt="Math Stars" width={160} height={42} priority/>
        <div className={styles.tools}>
          <span aria-label={stars+" stars"}><Star size={19} fill="#ffd058"/>{stars}</span>
          <button onClick={() => setSoundOn(!soundOn)} aria-label={soundOn ? "Mute sound" : "Enable sound"}>{soundOn ? <Volume2/> : <VolumeX/>}</button>
          <button onClick={() => dialog.current?.showModal()} aria-label="Open explorer kit"><Menu/></button>
        </div>
      </header>
      <section className={styles.mission}>
        <Image src="/explorer-study-bg.webp" fill sizes="(max-width: 1200px) 100vw, 1150px" priority alt="" className={styles.worldArt}/>
        <div className={styles.heroShade}/>
        <div className={styles.missionText}>
          <span className={styles.gradeLabel}>{gradeLabels[level]} · {name}</span>
          <h1>{next.lesson.title}</h1>
          <p>{resume ? (resume.nextIndex >= resume.total ? "Your answers are saved. Open your results." : `Pick up at question ${resume.nextIndex + 1} of ${resume.total}.`)
            : next.gradeComplete ? "You finished this grade. Revisit this skill for extra practice." : next.lesson.subtitle}</p>
          <button className={styles.sunButton} onClick={openMission}>
            {resume && resume.nextIndex >= resume.total ? "See my results" : next.returning ? "Continue my lesson" : next.gradeComplete ? "Practice this skill" : "Start my lesson"} <ArrowRight size={18}/></button>
        </div>
        <Image src="/pip-explorer.webp" width={900} height={1350} alt="" sizes="(max-width: 650px) 100px, 230px" className={styles.missionPip}/>
      </section>
      <section className={styles.section}>
        <h2>Choose an adventure</h2>
        <div className={styles.hubCards}>
          <WorldCard title="My discovery path" art="/journey-daily-mission-v2.webp" note="Three short stops picked for you" action={() => setView({name:"explorer"})}/>
          <WorldCard title="Reading & phonics" art="/journey-activity.webp" note="Blend sounds and find story clues" action={() => setView({name:"explorer",start:level==="preschool"||level==="grade1"?"sounds":"read"})}/>
          <WorldCard title="My explorer room" art="/explorer-study-bg.webp" note="Decorate with the stickers you earn" action={() => setView({name:"explorer",room:true})}/>
          {level === "grade3" && <WorldCard title="School Practice" art="/journey-activity.webp" note="Explore math, reading and science" action={() => setView({ name: "school-practice" })}/>}
          <WorldCard title="Math Arcade" art="/arcade-rocket-builder-v2.webp" note="Build rockets and hunt for treasure" action={() => setView({ name: "arcade" })}/>
          <WorldCard title="Times Table Lab" art="/equal-groups-baskets.webp" note="Explore the tables from 2 to 12" action={() => setView({ name: "times-tables" })}/>
          {settings?.dailyChallengeEnabled !== false && <WorldCard title="Daily Challenge" art="/journey-daily-mission-v2.webp" note="Try today’s five questions" action={() => setView({ name: "daily" })}/>}
        </div>
      </section>
      <div className={styles.dashboard}>
        <section id="journey-board" className={styles.mapPanel}>
          <span className={styles.sectionTag}><Map size={16}/> {gradeLabels[level]}</span><h2>Your adventure map</h2>
          <p>{overall.completed} of {overall.total} lessons complete</p>
          <progress aria-label="Grade progress" value={overall.percent} max={100}/>
          <div>{curriculum.map((domain, i) => {
            const finished = domain.lessons.filter(lesson => progress[lesson.id]?.status === "completed").length;
            return <button key={domain.id} className={styles.mapRow} onClick={() => setView({ name: "domain", domainId: domain.id })}>
              <span className={styles.mapIcon}>{[<Calculator key="a"/>, <BookOpen key="b"/>, <Sparkles key="c"/>][i%3]}</span>
              <span><strong>{domain.title}</strong><small>{finished} of {domain.lessons.length} lessons</small></span><ChevronRight size={18}/>
            </button>;
          })}</div>
        </section>
        <aside className={styles.side}>
          <section className={styles.statPanel}><h2>Your progress</h2><p><Star/> {stars} stars</p><p><Flame/> {streak} day{streak === 1 ? "" : "s"} in your streak</p>
            <button className={styles.textLink} onClick={() => setView({ name: "achievements" })}>See my badges <ArrowRight size={16}/></button>
          </section>
          {reward && <section className={styles.reward}><Gift/><h3>{reward.emoji} {reward.title}</h3>
            <p>{reward.status === "earned" ? "You earned your reward!" : `${reward.currentValue} of ${reward.targetValue} ${reward.targetType === "topic" ? (reward.domainTitle ?? "topic") + " lessons" : reward.targetType}`}</p>
            <progress aria-label="Family reward progress" value={reward.percent} max={100}/>
          </section>}
          {settings?.aiTutorEnabled !== false && <button className={styles.pipLink} onClick={() => setView({ name: "tutor" })}><ShieldQuestion/> Ask Pip for help <ArrowRight size={16}/></button>}
        </aside>
      </div>
      <footer className={styles.footer}><a href="/privacy">Family privacy</a><button onClick={() => dialog.current?.showModal()}>Explorer kit</button></footer>
    </div>
    <dialog ref={dialog} className={styles.dialog} aria-labelledby="explorer-kit-title">
      <div className={styles.sectionHead}><h2 id="explorer-kit-title">Explorer kit</h2><button aria-label="Close explorer kit" onClick={() => dialog.current?.close()}><X/></button></div>
      <div className={styles.kitGrid}>
        <Kit icon={<Trophy/>} label="My badges" action={() => setView({ name: "achievements" })}/>
        {settings?.worksheetsEnabled !== false && <Kit icon={<Printer/>} label="Worksheets" action={() => setView({ name: "worksheet" })}/>}
        <Kit icon={<Users/>} label="Grown-ups" action={() => setView({ name: "parent" })}/>
        <Kit icon={<CloudDownload/>} label="Offline packs" action={() => setView({ name: "offline" })}/>
        <Kit icon={<Settings/>} label="Install app" action={() => { dialog.current?.close(); window.dispatchEvent(new Event("mathstars-open-install")); }}/>
        <Kit icon={<RefreshCcw/>} label="Switch learner" action={switchLearner}/>
      </div>
      <button className={styles.textLink} disabled={signingOut} onClick={signOut}>Sign out to welcome page</button>
      {logoutError && <p role="alert">{logoutError}</p>}
    </dialog>
  </div>;
}

function WorldCard({title, art, note, action}: {title:string; art:string; note:string; action:()=>void}) {
  return <button className={styles.gameCard} onClick={action}><Image src={art} width={520} height={290} sizes="(max-width: 650px) 48vw, 275px" alt=""/>
    <div><div><h3>{title}</h3><p>{note}</p></div><ChevronRight size={18}/></div></button>;
}
function Kit({ icon, label, action }: {icon:ReactNode; label:string; action:()=>void}) {
  return <button onClick={action}>{icon}{label}</button>;
}

