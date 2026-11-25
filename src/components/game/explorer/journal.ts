"use client";
import { useEffect, useSyncExternalStore } from "react";
import { loadSnapshot, saveSnapshot, removeSnapshot, listSnapshotsWithPrefix } from "@/lib/offline/database";
import { lessons } from "@/lib/school-practice";
import { mergeJournal, type Entry, type Journal } from "@/lib/explorer";

interface Snapshot { entries:Journal; status:"loading"|"saved"|"waiting"|"device"; ready:boolean }
const empty:Snapshot={entries:{},status:"loading",ready:false};
function createChannel(profile:string) {
  let view=empty;
  let busy:Promise<void>|null=null;
  let dirty=false;
  let imported=false;
  const prefix="explorer-pending:"+profile+":";
  const cache="explorer-cache:"+profile;
  const queued=new Map<string,Entry[]>();
  const listeners=new Set<()=>void>();
  function publish(patch:Partial<Snapshot>) {
    view={...view,...patch};
    listeners.forEach(fn=>fn());
  }
  async function write(entries:Entry[]) {
    const key=prefix+crypto.randomUUID();
    queued.set(key,entries);
    publish({entries:mergeJournal(view.entries,entries),status:"waiting"});
    try { await saveSnapshot(key,entries); } catch { publish({status:"device"}); }
    dirty=true;
    await refresh();
  }
  async function run() {
    const cached=await loadSnapshot<Journal>(cache).catch(()=>null);
    if(cached) publish({entries:mergeJournal(view.entries,Object.values(cached))});
    const disk=await listSnapshotsWithPrefix<Entry[]>(prefix).catch(()=>[]);
    for(const row of disk) queued.set(row.key,row.value);
    publish({entries:mergeJournal(view.entries,Array.from(queued.values()).flat())});
    if(!imported) {
      const ids=await Promise.all(lessons.map(async l=>await loadSnapshot<boolean>("school-sticker:"+profile+":"+l.id).catch(()=>false)?l.id:""));
      const legacy=ids.filter(id=>id && !view.entries["stamp/school-"+id]).map(id=>({key:"stamp/school-"+id,value:"earned",at:1}));
      if(legacy.length) {
        const key=prefix+"legacy";
        queued.set(key,legacy);
        await saveSnapshot(key,legacy).catch(()=>{});
        publish({entries:mergeJournal(view.entries,legacy)});
      }
      imported=true;
    }
    const headers={"x-profile-id":profile,"Content-Type":"application/json"};
    try {
      for(const [key,entries] of Array.from(queued)) {
        const res=await fetch("/api/explorer",{method:"POST",headers,body:JSON.stringify({entries}),signal:AbortSignal.timeout(12000)});
        if(!res.ok) throw Error();
        await removeSnapshot(key).catch(()=>{});
        queued.delete(key);
      }
      const res=await fetch("/api/explorer",{headers,cache:"no-store",signal:AbortSignal.timeout(12000)});
      if(!res.ok) throw Error();
      const data=await res.json() as {entries:Entry[]};
      const entries=mergeJournal(view.entries,data.entries);
      publish({entries,ready:true,status:queued.size?"waiting":"saved"});
      await saveSnapshot(cache,entries).catch(()=>{});
    } catch {
      publish({ready:true,status:typeof indexedDB==="undefined"?"device":"waiting"});
    }
  }
  function refresh():Promise<void> {
    if(busy) return busy;
    busy=(async()=>{do {dirty=false;await run();} while(dirty);})().finally(()=>{busy=null;});
    return busy;
  }
  return {read:()=>view, subscribe:(fn:()=>void)=>{listeners.add(fn);return ()=>{listeners.delete(fn);};},write,refresh};
}
const channels=new Map<string,ReturnType<typeof createChannel>>();
function channel(profile:string) {
  const existing=channels.get(profile);
  if(existing) return existing;
  const item=createChannel(profile);channels.set(profile,item);return item;
}
export function record(profile:string, pairs:ReadonlyArray<readonly [string,string]>) {
  const at=Date.now();
  return channel(profile).write(pairs.map(([key,value])=>({key,value,at})));
}
export function useJournal(profile:string) {
  const source=channel(profile);
  const data=useSyncExternalStore(source.subscribe,source.read,()=>empty);
  useEffect(()=>{
    const refresh=()=>{void source.refresh();};
    refresh();
    window.addEventListener("online",refresh);
    window.addEventListener("focus",refresh);
    const timer=window.setInterval(()=>{if(document.visibilityState==="visible") refresh();},60000);
    return ()=>{window.removeEventListener("online",refresh);window.removeEventListener("focus",refresh);clearInterval(timer);};
  },[source]);
  return {...data,refresh:source.refresh};
}
