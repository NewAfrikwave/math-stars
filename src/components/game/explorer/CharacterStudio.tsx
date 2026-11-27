"use client";

import { useState, type CSSProperties } from "react";
import { choices, parts, characterRewards, readCharacter, type Part, type Character } from "@/lib/explorer-character";
import type { Journal } from "@/lib/explorer";
import { useGameStore } from "@/store/useGameStore";
import { record, useJournal } from "./journal";
import { AnimalPortrait } from "./AnimalPortrait";
import s from "./CharacterStudio.module.css";

const labels: Record<Part, string> = { kind: "Explorer", skin: "Skin tone", hairstyle: "Hairstyle", hair: "Hair color", outfit: "Outfit", shirt: "Outfit color", gear: "Accessories" };

function Portrait({ look, turn = 0 }: { look: Character; turn?: number }) {
  if (look.kind !== "human") return <AnimalPortrait look={look} turn={turn}/>;
  return <span className={s.doll} data-outfit={look.outfit} data-cut={look.hairstyle} data-gear={look.gear} aria-hidden="true"
    style={{ "--skin": choices.skin[look.skin], "--hair": choices.hair[look.hair], "--shirt": choices.shirt[look.shirt] } as CSSProperties}>
    <i className={s.longHair}/><i className={s.earLeft}/><i className={s.earRight}/>
    <i className={s.neck}/><i className={s.coat}/><i className={s.seam}/>
    {look.outfit === "dress" && <i className={s.dressStar}>★</i>}
    <i className={s.face}/><i className={s.cap}/><i className={s.fringe}/>
    <i className={s.browLeft}/><i className={s.browRight}/><i className={s.eyeLeft}/><i className={s.eyeRight}/>
    <i className={s.nose}/><i className={s.smile}/>
    {look.gear === "bow" && <i className={s.bow}/>}
    {look.gear === "headband" && <i className={s.headband}/>}
    {look.gear === "scarf" && <i className={s.scarf}/>}
    {look.gear === "pin" && <i className={s.pin}>★</i>}
    {look.gear === "glasses" && <i className={s.glasses}/>}
    {look.gear === "crown" && <i className={s.crown}/>}
  </span>;
}

export function HomeCharacter({ profile }: { profile: string }) {
  const { entries } = useJournal(profile);
  const stars = useGameStore(state => state.totalStars);
  return <span className={s.thumbnail}><Portrait look={readCharacter(entries, stars)}/></span>;
}

export function CharacterStudio({ profile, entries }: { profile: string; entries: Journal }) {
  const stars = useGameStore(state => state.totalStars);
  const [part, setPart] = useState<Part>("kind");
  const [note, setNote] = useState("");
  const look = readCharacter(entries, stars);
  const [turn, setTurn] = useState(-10);
  const animal = look.kind !== "human";
  const availableParts = animal ? parts.filter(p => p === "kind" || p === "shirt" || p === "gear") : parts;
  const active = availableParts.includes(part) ? part : "kind";
  const rewards = characterRewards(entries, stars);
  const swatches = active === "skin" || active === "hair" || active === "shirt";
  return <section className={s.studio} aria-label="Character studio">
    <div className={s.spotlight}><Portrait look={look} turn={turn}/>
      {animal && <div className={s.turns}>
        <button aria-label="Turn animal left" onClick={() => setTurn(t => (t - 30) % 360)}>↶</button>
        <button aria-label="Turn animal right" onClick={() => setTurn(t => (t + 30) % 360)}>↷</button>
      </div>}
    </div>
    <div className={s.controls}>
      <h2>My character</h2>
      <p>Pick your look. Earn accessories as you learn.</p>
      <div className={s.tabs} role="group" aria-label="Choose what to change">
        {availableParts.map(field => <button key={field} aria-pressed={active === field} onClick={() => {setPart(field); setNote("");}}>{labels[field]}</button>)}
      </div>
      <fieldset className={s.options}><legend>{labels[active]}</legend>
        {Object.entries(choices[active]).map(([id, value]) => {
          const reward = active === "gear" ? rewards[id as Character["gear"]] : null;
          const label = swatches ? id[0].toUpperCase() + id.slice(1) : value;
          return <button key={id} disabled={reward?.available === false} aria-pressed={look[active] === id}
            onClick={() => {
              void record(profile, [["character/" + active, id]]);
              setNote(labels[active] + " set to " + label + ".");
            }}>
            {swatches && <i aria-hidden="true" style={{ backgroundColor: value }}/>}
            {label}{look[active] === id && <b aria-hidden="true"> ✓</b>}
            {reward && !reward.available && <small>{reward.goal}</small>}
          </button>;
        })}
      </fieldset>
      <span role="status" className={s.note}>{note}</span>
    </div>
  </section>;
}
