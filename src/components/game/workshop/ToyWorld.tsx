"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { Model, World } from "./missions";
import styles from "./workshop.module.css";

type Vars = CSSProperties & Record<`--${string}`, string>;
const seq = (length: number) => Array.from({length}, (_,i)=>i);
const at = (x:number,y:number,z:number) => `translate3d(${x}px,${-y}px,${z}px)`;

function Group({x=0,y=0,z=0,children}: {x?:number;y?:number;z?:number;children:ReactNode}) {
  return <div className={styles.group} style={{transform:at(x,y,z)}}>{children}</div>;
}
// Six faces share an origin. Models stay three-dimensional as the camera turns.
function Brick({x=0,y=0,z=0,w,h,d,color,grid=false,round=false}: {
  x?:number;y?:number;z?:number;w:number;h:number;d:number;color:string;grid?:boolean;round?:boolean;
}) {
  const vars: Vars = {"--w":w+"px","--h":h+"px","--d":d+"px","--paint":color,transform:at(x,y+h/2,z)};
  return <div className={styles.brick} style={vars} data-grid={grid} data-round={round}>
    {["front","back","left","right","top","bottom"].map(face=><i key={face} className={styles[face]} />)}
  </div>;
}
function Sign({x,y,z=0,children,onClick,target}: {x:number;y:number;z?:number;children:ReactNode;onClick?:()=>void;target?:number}) {
  return <Group x={x} y={y} z={z}>{onClick ?
    <button data-drop={target} className={styles.sign} onClick={onClick}>{children}</button> :
    <span className={styles.sign}>{children}</span>}</Group>;
}
function Fox() {
  return <>
    <Brick w={29} h={24} d={20} color="#dc732a" />
    <Brick y={20} w={35} h={26} d={25} color="#ed8640" />
    {[-11,11].map(x=><Group key={x} x={x}><Brick y={45} w={9} h={11} d={10} color="#9b4a29"/><Brick y={34} z={13} w={4} h={5} d={2} color="#24253c"/></Group>)}
    <Brick y={22} z={14} w={21} h={9} d={7} color="#ffecce"/><Brick y={28} z={18} w={6} h={5} d={4} color="#252638"/>
  </>;
}
function Fish() {
  return <><Brick w={42} h={23} d={15} color="#ff9538" round/><Brick x={-24} y={6} w={11} h={16} d={9} color="#ffbe4c"/><Brick x={-4} w={7} h={24} d={16} color="#fff3da"/><Brick x={14} y={14} z={8} w={4} h={4} d={3} color="#28213d"/></>;
}
function Coral({layers=1}:{layers?:number}) {
  return <><Brick w={66} h={11} d={45} color="#8c8c92" round/>
    {seq(layers).map(i=><Brick key={i} y={10+i*9} w={55-i*5} h={9} d={35} color={i%2?"#ffc0a0":"#f6d1ae"} round/>)}
    {layers>0 && seq(6).map(i=><Group key={i} x={(i%3-1)*12} y={10+layers*9} z={Math.floor(i/3)*10-5}>
      <Brick w={9} h={12+(i%3)*6} d={9} color="#fc786c" round/><Brick x={5} y={6} w={9} h={6} d={6} color="#ffa68e"/>
    </Group>)}</>;
}
function Tree({x,z}:{x:number;z:number}) {
  return <Group x={x} z={z}><Brick w={10} h={36} d={12} color="#9e6642"/><Brick y={29} w={39} h={34} d={36} color="#46a978" round/><Brick y={53} w={25} h={20} d={22} color="#7bcf86" round/></Group>;
}
function Person({color}:{color:string}) {
  return <><Brick w={22} h={31} d={17} color={color} round/><Brick y={30} w={21} h={21} d={19} color="#bb805c" round/><Brick y={46} w={22} h={7} d={20} color="#47303c"/></>;
}
const waterWorlds = new Set<World>(["reef","river","docks"]);
interface Props {pointMode?:"baskets"|"apples"; touched?:number[]; world:World; model:Model; onPick?:(i:number)=>void; cargo?:string; active:boolean; spinKey:number; description:string}
export function ToyWorld({pointMode,touched=[],world,model:m,onPick,cargo,active,spinKey,description}:Props) {
  const [yaw,setYaw]=useState(-12);
  const [simple,setSimple]=useState(false);
  const [drag,setDrag]=useState<{x:number;y:number}|null>(null);
  const dragStart=useRef<{x:number;y:number}|null>(null);
  const sceneId=useId();
  const host=useRef<HTMLDivElement>(null);
  const [scale,setScale]=useState(0.7);
  useEffect(()=>{
    const el=host.current;
    if(!el) return;
    const resize=()=>setScale(Math.min(el.clientWidth/500,1.45));
    resize();
    const observer=new ResizeObserver(resize);
    observer.observe(el);
    return ()=>observer.disconnect();
  },[]);
  const pick = (i:number) => onPick && active ? ()=>onPick(i) : undefined;
  const pos=m.position??-1;
  const padColor=waterWorlds.has(world)?"#54bec9":world==="cart"?"#a8a1cf":world==="blocks"?"#f3c58b":"#8dcf85";
  const labels=m.labels??[];
  const xs=[-130,0,130];
  let objects:ReactNode;
  switch(world){
    case "blocks":
      objects=(m.counts??[]).map((count,i)=><Group key={i} x={xs[i]}>
        <Brick w={98} h={6} d={84} color={["#a2cdb8","#a4c8eb","#f9c67e"][i]} round/>
        {seq(count).map(j=>i===0 ? <Brick key={j} x={j%2*13-12} z={-17+j*7} y={6} w={60} h={60} d={6} grid color="#43af87"/> :
          i===1 ? <Brick key={j} x={j%5*15-30} z={Math.floor(j/5)*18-7} y={6} w={6} h={60} d={6} grid color="#4989d7"/> :
          <Brick key={j} x={j%5*14-28} z={Math.floor(j/5)*15-16} y={6} w={8} h={8} d={8} color="#e88b24"/>)}
        <Sign x={0} y={-4} z={56} onClick={pick(i)}>{["Hundreds","Tens","Ones"][i]} · {count}</Sign>
      </Group>);break;
    case "river":
      objects=<>{xs.map((x,i)=><Group key={x} x={x} z={-16}><Brick w={93} h={16} d={65} color="#b4ba8e" round/><Sign x={0} y={13} z={38} target={i} onClick={pick(i)}>{labels[i]}</Sign></Group>)}
        <Group x={-160} z={74}><Brick w={68} h={10} d={45} color="#bc8c55"/><Sign x={0} y={-2} z={22}>{labels[3]}</Sign></Group>
        <div className={styles.traveler} style={{transform:at(pos<0?-160:xs[pos],pos<0?11:18,pos<0?70:-16)}}><Fox/></div></>;break;
    case "orchard":
      objects=<><Tree x={-189} z={-63}/><Tree x={179} z={-65}/>{seq(m.rows??3).map((_,i)=>{
        const n=m.counts?.[i]??m.each??0;
        return <Group key={i} x={(i-((m.rows??3)-1)/2)*94}><Brick w={81} h={9} d={74} color="#c49050"/><Brick y={8} z={34} w={82} h={8} d={5} color="#ac7144"/>
          {seq(n).map(j=><Group key={j} x={j%3*21-21} y={9} z={Math.floor(j/3)*22-12}><Brick w={16} h={16} d={16} color="#e65849" round/><Brick y={15} w={3} h={4} d={3} color="#735638"/>{pointMode==="apples" && <Sign x={0} y={27} z={0} onClick={pick(j)}>{touched.includes(j)?"✓":j+1}</Sign>}</Group>)}
          <Sign x={0} y={-3} z={55} onClick={m.counts || pointMode==="baskets"?pick(i):undefined}>{pointMode==="baskets"?(touched.includes(i)?"✓ Basket ":"Basket ")+(i+1):n+" apples"}</Sign></Group>})}</>;break;
    case "cart":
      objects=<><Brick w={416} h={5} d={72} color="#646383"/>{seq(6).map(i=><Group key={i} x={-161+i*62}><Brick y={5} w={4} h={1} d={69} color="#f4eac9"/><Sign x={0} y={1} z={54}>{i}</Sign></Group>)}
        <div className={styles.traveler} style={{transform:at(-161+Math.max(0,pos)*62,10,0)}}>
          <Brick y={8} w={46} h={15} d={28} color="#f6ac39" round/><Brick y={22} w={24} h={14} d={22} color="#76d8dc" round/>
          {[-15,15].flatMap(x=>[-14,14].map(z=><Brick key={x+","+z} x={x} z={z} w={12} h={12} d={7} color="#38364e" round/>))}</div></>;break;
    case "spinner":
      objects=<><Brick w={128} h={11} d={126} color="#936bb0" round/><Brick y={8} w={12} h={50} d={12} color="#f7c84e"/>
        <div key={spinKey} className={styles.spin} style={{"--angle":(m.turns??0)*360+"deg"} as Vars}><Brick y={46} w={132} h={8} d={14} color="#5d90c7"/><Brick y={47} w={14} h={8} d={132} color="#5d90c7"/>
          {[[-59,0],[59,0],[0,-59],[0,59]].map(([x,z],i)=><Brick key={i} x={x} z={z} y={49} w={20} h={18} d={20} color={["#f47471","#f0ba40","#74cab2","#a994dc"][i]} round/>)}</div></>;break;
    case "reef":
      objects=<><Group x={-123}><Coral layers={m.rows??2}/></Group><Group x={8} y={26}><Fish/></Group>
        <Group x={130}><Brick w={48} h={4} d={45} color="#47b7cf" round/>{[0,1,2].map(i=><Brick key={i} x={i*9-9} y={8+i*13} w={8+i*2} h={8+i*2} d={8+i*2} color="#afedef" round/>)}</Group>
        {m.rows===undefined && ["Coral polyp","Reef fish","Water"].map((name,i)=><Sign key={name} x={xs[i]} y={0} z={51} onClick={pick(i)}>{pos===i?"● ":""}{name}</Sign>)}</>;break;
    case "garden":
      objects=<><Tree x={171} z={-60}/>{seq(4).map(i=><Group key={i} x={-117+i*73}><Brick w={4} h={36} d={4} color="#349451"/>
        <Brick x={-5} y={11} w={12} h={5} d={5} color="#6cb957"/>
        {(!m.night||i===0) ? <>{[[-9,0],[9,0],[0,9],[0,-9]].map(([x,z],j)=><Brick key={j} x={x} z={z} y={35} w={13} h={10} d={13} color="#ee83a3" round/>)}<Brick y={42} w={10} h={6} d={10} color="#ffcf47"/></>:<Brick y={34} w={8} h={16} d={8} color="#9fbe69" round/>}</Group>)}</>;break;
    case "docks":
      objects=<>{xs.map((x,i)=><Group key={x} x={x}><Brick w={96} h={10} d={70} color="#bc945f"/><Brick x={-39} z={-25} w={6} h={28} d={6} color="#996a44"/><Sign x={0} y={10} z={32} target={i} onClick={pick(i)}>{labels[i]?.toUpperCase()}</Sign></Group>)}
        <div className={styles.traveler} style={{transform:at(pos<0?0:xs[pos],12,pos<0?76:-10)}}><Brick w={37} h={28} d={31} color="#e69b47"/><Brick y={0} w={7} h={29} d={32} color="#905738"/></div></>;break;
    case "playground":
      objects=<><Tree x={-174} z={-52}/><Tree x={167} z={-60}/><Brick x={-20} y={14} w={109} h={7} d={30} color="#b87f4b"/><Brick x={-20} z={-16} y={22} w={110} h={19} d={5} color="#b87f4b"/>{[-60,19].map(x=><Brick key={x} x={x} w={7} h={14} d={20} color="#744d3d"/>)}
        <Group x={-49} y={20}><Person color="#428ac4"/></Group><div className={styles.traveler} style={{transform:at(pos===1?8:103,pos===1?20:0,0)}}><Person color="#af69b8"/></div></>;break;
  }
  return <div className={styles.viewport} data-biome={world} id={sceneId} ref={host}>
    <div className={styles.cameraControls}><button aria-label="Turn model left" onClick={()=>setYaw(y=>Math.max(-30,y-12))}>↶</button><button aria-label="Turn model right" onClick={()=>setYaw(y=>Math.min(30,y+12))}>↷</button><button onClick={()=>setSimple(!simple)}>{simple?"3D view":"Text view"}</button></div>
    {simple ? <p className={styles.transcript}>{description}</p> : <div className={styles.framing} style={{transform:"scale("+scale+")"}}>
      <div className={styles.camera} style={{transform:`rotateX(-23deg) rotateY(${yaw}deg)`}}>
        <Brick y={-17} w={435} h={16} d={184} color={padColor} round/>{objects}
      </div></div>}
    {cargo && active && !simple && <button className={styles.cargo} style={{transform:drag?`translate(${drag.x}px,${drag.y}px)`:undefined}} aria-label={"Drag "+cargo+" to a dock, or choose a dock below"}
      onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId); dragStart.current={x:e.clientX,y:e.clientY};setDrag({x:0,y:0});}}
      onPointerMove={e=>{if(dragStart.current)setDrag({x:e.clientX-dragStart.current.x,y:e.clientY-dragStart.current.y});}}
      onPointerCancel={()=>{dragStart.current=null;setDrag(null);}}
      onPointerUp={e=>{
        const target=document.elementsFromPoint(e.clientX,e.clientY).map(node=>node.closest<HTMLElement>("[data-drop]")).find(Boolean);
        dragStart.current=null;setDrag(null);
        if(target?.dataset.drop!==undefined) onPick?.(Number(target.dataset.drop));
      }}>{cargo} ⤴</button>}
  </div>;
}

