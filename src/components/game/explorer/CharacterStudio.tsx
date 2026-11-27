"use client";

import { useState, type CSSProperties } from "react";
import { choices, parts, characterRewards, readCharacter, type Part, type Character } from "@/lib/explorer-character";
import type { Journal } from "@/lib/explorer";
import { useGameStore } from "@/store/useGameStore";
import { record, useJournal } from "./journal";
import s from "./CharacterStudio.module.css";

const labels: Record<Part, string> = { skin: "Skin tone", hairstyle: "Hairstyle", hair: "Hair color", shirt: "Outfit color", gear: "Accessories" };

function Portrait({ look }: { look: Character }) {
  return <span className={s.doll} data-cut={look.hairstyle} data-gear={look.gear} aria-hidden="true"
    style={{ "--skin": choices.skin[look.skin], "--hair": choices.hair[look.hair], "--shirt": choices.shirt[look.shirt] } as CSSProperties}>
    <i className={s.earLeft}/><i className={s.earRight}/>
    <i className={s.neck}/><i className={s.coat}/><i className={s.seam}/>
    <i className={s.face}/><i className={s.cap}/><i className={s.fringe}/>
    <i className={s.browLeft}/><i className={s.browRight}/><i className={s.eyeLeft}/><i className={s.eyeRight}/>
    <i className={s.nose}/><i className={s.smile}/>
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
  const [part, setPart] = useState<Part>("skin");
  const [note, setNote] = useState("");
  const look = readCharacter(entries, stars);
  const rewards = characterRewards(entries, stars);
  const swatches = part === "skin" || part === "hair" || part === "shirt";
  return <section className={s.studio} aria-label="Character studio">
    <div className={s.spotlight}><Portrait look={look}/></div>
    <div className={s.controls}>
      <h2>My character</h2>
      <p>Pick your look. Earn accessories as you learn.</p>
      <div className={s.tabs} role="group" aria-label="Choose what to change">
        {parts.map(field => <button key={field} aria-pressed={part === field} onClick={() => {setPart(field); setNote("");}}>{labels[field]}</button>)}
      </div>
      <fieldset className={s.options}><legend>{labels[part]}</legend>
        {Object.entries(choices[part]).map(([id, value]) => {
          const reward = part === "gear" ? rewards[id as Character["gear"]] : null;
          const label = swatches ? id[0].toUpperCase() + id.slice(1) : value;
          return <button key={id} disabled={reward?.available === false} aria-pressed={look[part] === id}
            onClick={() => {
              void record(profile, [["character/" + part, id]]);
              setNote(labels[part] + " set to " + label + ".");
            }}>
            {swatches && <i aria-hidden="true" style={{ backgroundColor: value }}/>}
            {label}{look[part] === id && <b aria-hidden="true"> ✓</b>}
            {reward && !reward.available && <small>{reward.goal}</small>}
          </button>;
        })}
      </fieldset>
      <span role="status" className={s.note}>{note}</span>
    </div>
  </section>;
}
