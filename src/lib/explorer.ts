import { bookSets, pages, type Page } from "./decodable-books";
import { validCharacterPart } from "./explorer-character";
import { postGuides, validPostEntry } from "./trading-post";
import { lessons } from "./school-practice";

export const trails = {
  groups: ["Orchard detectives", "🍎"], trade: ["Block trading practice", "🧱"],
  round: ["River landings", "🦊"], count: ["Basket buddies", "🧺"],
  sum: ["Picnic partners", "🍐"], sounds: ["Sound studio", "🎵"],
  read: ["Story detectives", "📚"], field: ["Field notebook", "🔎"],
} as const;
export type Trail = keyof typeof trails;
export const skills = {
  baskets: ["Count equal groups", "Point to each basket once."],
  each: ["Explain the size of a group", "Put a finger on one basket and count only its apples."],
  total: ["Explain the product", "Sweep a finger across every basket, counting by the group size."],
  jumps: ["Subtract on a number line", "Start at the larger number and take back hundreds, tens, then ones."],
  exchange: ["Trade one ten for ten ones", "Build 52. Exchange one ten and count the loose ones together."],
  remainder: ["Subtract after a trade", "After the trade, take away the tens and ones separately."],
  transfer: ["Regroup on a fresh subtraction problem", "Build 43 and take away 18. Ask what changed when a ten was traded."],
  nearest: ["Round to the nearest ten", "Mark the two neighboring tens and count the distance to each."],
  counting: ["Count objects one at a time", "Touch each object as you say its number."],
  taking: ["Take away shells and find how many remain", "Count out five objects. Give two away and count what is left."],
  joining: ["Combine two groups", "Count the first group, then count on through the second group."],
  decoding: ["Blend sounds into a word", "Say each sound slowly, then slide them together and read the word."],
  meaning: ["Find meaning in a sentence", "Read the sentence together. Ask who did what."],
  sequence: ["Retell events in order", "Name what happened first, then say what changed at the end."],
  idea: ["Find the main idea or inference", "Ask what the sentences tell you together."],
  evidence: ["Support an answer with a sentence", "Ask your reader to point to the words that helped them decide."],
  predict: ["Predict from observations", "Compare two observations and say what changed."],
} as const;
export type Skill = keyof typeof skills;
export const trailSkills: Record<Trail, Skill[]> = {
  groups:["baskets","each","total"], trade:["jumps","exchange","remainder","transfer"], round:["nearest"],
  count:["counting"], sum:["joining"], sounds:["decoding","meaning"], read:["idea","evidence","sequence"], field:["predict","evidence"]
};
export interface Entry { key: string; value: string; at: number }
export type Journal = Record<string,Entry>;
export const dayKey = (d = new Date()) => [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");
const dateKey = /^\d{4}-\d{2}-\d{2}$/;
const has = (obj: object, key: string) => Object.prototype.hasOwnProperty.call(obj,key);
export function skillInfo(id:string): readonly [string,string] | undefined {
  const set=bookSets.find(item=>id==="pattern-"+item.id);
  if(set) return ["Build words with "+set.name.toLowerCase(),"Read "+set.example+" together. Find another word in the set with the same sound."];
  if(has(skills,id)) return skills[id as Skill];
  const [lessonId, step] = id.split(".");
  const q = lessons.find(l=>l.id === lessonId)?.checks[Number(step)];
  if(q && id === lessonId+"."+Number(step)) return [q.prompt, q.hint];
}
export function knownStamp(id:string) {
  return id==="reef" || id==="workshop" || id==="shell-post" || bookSets.some(set=>id==="bookset-"+set.id) || has(trails,id) || lessons.some(l=>id === "school-"+l.id);
}
export function validEntry(raw:unknown): raw is Entry {
  if(!raw || typeof raw !== "object") return false;
  const e = raw as Entry;
  if(typeof e.key!=="string" || e.key.length>100 || typeof e.value!=="string" || !Number.isSafeInteger(e.at) || e.at<=0 || e.at>Date.now()+86400000) return false;
  const p=e.key.split("/");
  if(p[0]==="post-guide") return p.length===2 && postGuides.some(guide=>guide===p[1]) && e.value==="seen";
  if(p[0]==="character") return p.length===2 && validCharacterPart(p[1], e.value);
  if(p[0]==="stamp") return p.length===2 && knownStamp(p[1]) && e.value==="earned";
  if(p[0]==="slot") return p.length===2 && /^[0-3]$/.test(p[1]) && (e.value==="empty" || knownStamp(e.value));
  if(p[0]==="book" || p[0]==="bookhelp") {
    return p.length===3 && bookSets.some(set=>set.books.some(b=>b.id===p[1])) && pages.includes(p[2] as Page)
      && (p[0]==="book"?e.value==="done":["yes","no"].includes(e.value));
  }
  if(!dateKey.test(p[1])) return false;
  if(p[0]==="mission") return p.length===5 && ["preschool","grade1","grade2","grade3","grade4"].includes(p[2])
    && ["workshop","reef"].includes(p[3]) && ["guided","fresh"].includes(p[4]) && e.value==="done";
  if(p[0]==="post") return p.length===4 && validPostEntry(p[2],p[3],e.value);
  if(p[0]==="finish") return p.length===3 && has(trails,p[2]) && e.value==="done";
  if(p[0]==="aid") return p.length===4 && has(trails,p[2]) && /^[0-6]$/.test(p[3]) && ["yes","no"].includes(e.value);
  if(p[0]==="step") return p.length===4 && has(trails,p[2]) && /^[0-6]$/.test(p[3]) && e.value==="done";
  return p[0]==="skill" && p.length===4 && !!skillInfo(p[2]) && ["hint","helped","solo"].includes(p[3]) && e.value==="seen";
}
export function mergeJournal(base:Journal, entries:Entry[]):Journal {
  const next={...base};
  for(const e of entries) {
    const prev=next[e.key];
    if(!prev || prev.at<e.at || (prev.at===e.at && prev.value<e.value)) next[e.key]=e;
  }
  return next;
}
export function outcomes(journal:Journal, before?:string, after?:string) {
  const latest:Record<string,{kind:string;at:number}>={};
  for(const e of Object.values(journal)) {
    const [type,day,id,kind]=e.key.split("/");
    if(type!=="skill" || (before && day>=before) || (after && day<after)) continue;
    if(!latest[id] || latest[id].at<=e.at) latest[id]={kind,at:e.at};
  }
  return latest;
}
export function dailyPath(level:string, journal:Journal, day:string):Trail[] {
  const early=level==="preschool" || level==="grade1";
  const math:Trail[]=early?["count","sum"]:level==="grade2"?["sum","round","trade"]:["groups","trade","round"];
  const prior=outcomes(journal,day);
  const related:Partial<Record<Trail,string[]>>={
    groups:["groups","facts"], trade:["subtract"], round:["round"], sum:["addition"],
    sounds:["blend-1","blend-2","blend-3"], read:["ocean-words","reef","reef-sequence","caption"],
    field:["motion-data","fair-test","pushes"]
  };
  function ranked(track:Trail,solo:boolean) {
    const checks=Object.entries(prior).filter(([id,result])=>
      (trailSkills[track].includes(id as Skill) || related[track]?.includes(id.split(".")[0])) &&
      (result.kind==="solo")===solo);
    return Math.max(0,...checks.map(([,result])=>result.at));
  }
  const weakest=[...math].sort((a,b)=>ranked(b,false)-ranked(a,false))[0];
  const focus=ranked(weakest,false)>0?weakest:math[1];
  const strength=math.filter(t=>t!==focus).sort((a,b)=>ranked(b,true)-ranked(a,true))[0];
  const discovery:Trail[]=early?["sounds","read","field"]:["read","sounds","field"];
  const dayIndex=Math.floor(Date.parse(day+"T12:00:00Z")/86400000);
  const rotation=discovery[dayIndex%discovery.length];
  const readingNeed=[...discovery].sort((a,b)=>ranked(b,false)-ranked(a,false))[0];
  const extraPractice=dayIndex%2===0 && ranked(readingNeed,false)>0;
  return [strength,focus,extraPractice?readingNeed:rotation];
}
