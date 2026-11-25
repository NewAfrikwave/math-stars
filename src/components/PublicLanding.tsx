"use client";

import Image from "next/image";
import { useState } from "react";
import { ArrowRight, BookOpen, Flag, Headphones, Play, Star, Users } from "lucide-react";
import { HomeOrchard } from "./HomeOrchard";
import styles from "./HomeWorld.module.css";

const levels = [
  { title: "Preschool", copy: "Count objects, compare groups and spot shapes.", sample: "How many apples can you see?" },
  { title: "Grade 1", copy: "Build number sense and connect addition to objects you can count.", sample: "What happens when you add one more?" },
  { title: "Grade 2", copy: "Explore tens and ones and choose strategies for adding and subtracting.", sample: "Can you make the same number another way?" },
  { title: "Grade 3", copy: "Make equal groups, trade place-value blocks and explore reading and science in School Practice.", sample: "Can you show why three groups of four make twelve?" },
  { title: "Grade 4", copy: "Work with larger numbers, fractions and problems with more than one step.", sample: "Which steps will help you find the missing part?" }
];
const games = [
  { name: "Rocket Builder", image: "/arcade-rocket-builder-v2.webp", skill: "Addition and place value" },
  { name: "Treasure Hunt", image: "/arcade-treasure-hunt-v2.webp", skill: "Word problems and fractions" },
  { name: "Math Race", image: "/arcade-math-race-v2.webp", skill: "Math fact practice" }
];

export function PublicLanding() {
  const [grade, setGrade] = useState(3);
  const selected = levels[grade];
  return <div className={styles.page}>
    <section id="adventure" className={styles.publicHero}>
      <Image src="/landing-hero-world-v3.webp" alt="" fill priority sizes="100vw" className={styles.worldArt}/>
      <div className={styles.heroShade}/>
      <div className={styles.heroInner}>
        <div className={styles.heroText}>
          <span className={styles.gradeLabel}>Preschool through Grade 4</span>
          <h1>Come play math<br/>with <em>Pip.</em></h1>
          <p>Pack apple baskets, build rockets and solve little mysteries. Pick an adventure and learn one move at a time.</p>
          <div className={styles.buttons}><a className={styles.sunButton} href="#journey"><Play size={18} fill="currentColor"/> Try a game</a>
            <a href="/signin?mode=register" className={styles.glassButton}>Create free account <ArrowRight size={17}/></a></div>
        </div>
        <Image src="/pip-explorer.webp" alt="Pip the explorer fox" width={900} height={1350} priority sizes="(max-width: 650px) 150px, 310px" className={styles.heroPip}/>
      </div>
    </section>
    <div className={styles.wrap}>
      <section id="journey" className={styles.demoSection}>
        <div><span className={styles.sectionTag}><Star size={16}/> Play a sample</span>
          <h2>Pip’s apple orchard</h2><p>Can you give every basket the same number of apples? Play a round together and see how counting becomes multiplication.</p>
          <p className={styles.small}>Three short challenges · No account needed</p></div>
        <HomeOrchard/>
      </section>
      <section id="levels" className={styles.band}>
        <div><span className={styles.sectionTag}><BookOpen size={16}/> Learning paths</span><h2>Find your grade</h2></div>
        <div className={styles.gradePanel}>
          <div className={styles.buttons} role="group" aria-label="Choose a grade">{levels.map((level, i) =>
            <button key={level.title} aria-pressed={grade === i} onClick={() => setGrade(i)}>{level.title}</button>)}</div>
          <div aria-live="polite"><h3>{selected.sample}</h3><p>{selected.copy}</p></div>
        </div>
      </section>
      <section id="arcade" className={styles.section}>
        <div className={styles.sectionHead}><div><span className={styles.sectionTag}><Flag size={16}/> Math Arcade</span><h2>Pick your kind of play</h2></div><a className={styles.textLink} href="/signin">Sign in to play <ArrowRight size={17}/></a></div>
        <div className={styles.gameGrid}>{games.map(game=><a href="/signin" className={styles.gameCard} key={game.name}>
          <Image src={game.image} width={600} height={360} sizes="(max-width: 650px) 95vw, 32vw" alt=""/>
          <div><div><h3>{game.name}</h3><p>{game.skill}</p></div><ArrowRight size={20}/></div>
        </a>)}</div>
      </section>
      <section id="parents" className={styles.parents}>
        <div><span className={styles.sectionTag}><Users size={16}/> For grown-ups</span><h2>A place for each learner</h2><p>Give each child a profile, follow their lesson progress and set a family reward they can work toward.</p><a href="/signin?mode=register" className={styles.sunButton}>Create a family account <ArrowRight size={17}/></a></div>
        <ul><li><BookOpen/>Lessons and printable practice</li><li><Headphones/>Read-aloud help when kids need it</li><li><Star/>Progress and personal reward goals</li></ul>
      </section>
      <footer className={styles.footer}><Image src="/brand/math-stars-logo.png" alt="Math Stars" width={150} height={39}/><nav aria-label="Family resources"><a href="/support">Support</a><a href="/transparency">Transparency</a><a href="/privacy">Privacy</a><a href="https://www.norzolabs.com/">NorzoLabs</a></nav></footer>
    </div>
  </div>;
}
