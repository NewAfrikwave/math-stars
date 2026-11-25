import type { Skill,Trail } from "@/lib/explorer";
import type { Model, World } from "../workshop/missions";

export interface Stage {
  skill:Skill; prompt:string; answer:string; choices?:string[]; clue:string; success:string;
  passage?:string[]; evidence?:boolean; sounds?:string; guided?:boolean;
  scene?:{world:World; model:Model; description:string; after?:Model};
  point?:"baskets"|"apples"; points?:number;
  scaffold?:{prompt:string; choices:string[]; answer:string};
}
const storyBank=[
  {sentences:["Mira put a shallow bowl of water in the shade.","A robin landed, dipped its beak, and drank.","By noon two more birds had visited the bowl."],question:"Why did the birds visit Mira’s garden?",answer:"They found water to drink.",others:["They wanted to build a nest.","They were hiding from Mira."],proof:1},
  {sentences:["Tari left a paper flag beside the bean seedlings.","After a week the leaves reached above the flag.","He drew the taller plants in his notebook."],question:"What did Tari learn from the flag?",answer:"The seedlings had grown taller.",others:["The beans needed less light.","The flag made the leaves grow."],proof:1},
  {sentences:["Two children heard a scratching sound by the gate.","A puppy stood there with its leash caught on a twig.","They freed the leash and the puppy wagged its tail."],question:"Why did the children stop at the gate?",answer:"They found a puppy that needed help.",others:["They wanted to plant a tree.","They were looking for a new leash."],proof:1}
];
const wordBank=[
  {word:"map",line:"Sam has a map.",q:"What does Sam have?",a:"A map",other:["A mat","A cup"],words:["map","mat","cap"]},
  {word:"sun",line:"The sun is hot.",q:"What is hot?",a:"The sun",other:["The sand","The pan"],words:["sun","run","sit"]},
  {word:"sit",line:"Pip can sit on a log.",q:"Where can Pip sit?",a:"On a log",other:["In a box","On a bed"],words:["sit","sat","sip"]},
  {word:"spin",line:"The wind can spin the pinwheel.",q:"What makes the pinwheel move?",a:"The wind",other:["The rain","A bell"],words:["spin","skin","pin"]},
  {word:"skip",line:"Nia can skip over the rope.",q:"What does Nia skip over?",a:"A rope",other:["A log","A puddle"],words:["skip","sip","slip"]},
  {word:"smell",line:"I smell mint when I rub the leaf.",q:"What do I rub to smell mint?",a:"A leaf",other:["A seed","A stem"],words:["smell","spell","sell"]}
];
export function stages(trail:Trail,level:string,seed:number):Stage[] {
  const early=level==="preschool" || level==="grade1";
  const v=Math.abs(seed)%3;
  if(trail==="sounds") {
    const w=wordBank[v+(early?0:3)];
    return [
      {skill:"decoding",prompt:"Slide the sounds together. Which word do they make?",sounds:w.word,choices:w.words,answer:w.word,clue:"Start at the first sound. Keep your voice moving as you join it to the next sound.",success:"You blended the sounds in "+w.word+"."},
      {skill:"meaning",prompt:w.q,passage:[w.line],choices:[w.a,...w.other],answer:w.a,clue:"Read the sentence again. Point to the part that answers the question.",success:w.line}
    ];
  }
  if(trail==="read") {
    const simpleStories=[
      {sentences:["Pip sees a wet pup.","Pip gets a towel.","The pup is dry."],question:"Why does Pip get the towel?",answer:"To dry the pup.",others:["To feed the pup.","To hide a ball."],proof:2},
      {sentences:["A cat sits by a shut door.","Nia opens it.","The cat runs out."],question:"What did the cat want to do?",answer:"Go outside.",others:["Eat a snack.","Take a nap."],proof:2},
      {sentences:["Sam has a red seed pot.","He puts a seed in the soil.","A leaf pops up."],question:"What is this story about?",answer:"A seed growing.",others:["A lost leaf.","A red apple."],proof:2}
    ];
    const s=(early?simpleStories:storyBank)[v];
    return [
      {skill:"idea",prompt:s.question,passage:s.sentences,answer:s.answer,choices:[s.answer,...s.others],clue:"Think about what happened first and what changed next.",success:s.answer},
      {skill:"evidence",prompt:"Which sentence supports this idea? "+s.answer,passage:s.sentences,evidence:true,choices:s.sentences,answer:s.sentences[s.proof],clue:"Look for the action that shows how you know.",success:"That detail supports your idea: "+s.answer},
      {skill:"sequence",prompt:"Retell the story. Which event happened first?",choices:s.sentences,answer:s.sentences[0],clue:"Picture the beginning, before anything changed.",success:s.sentences.join(" ")}
    ];
  }
  if(trail==="field") {
    const text=early?["Pip pushes a toy car.","It rolls across the rug and stops."]:["Pip tries two pushes on the same car and track.","A gentle push moves the car two tiles.","A stronger push moves it five tiles."];
    const ans=early?"It will roll.":"The stronger push.";
    return [
      {skill:"predict",prompt:early?"What do you predict when Pip pushes the car again?":"Which push do you predict will carry the same car farther?",passage:text,choices:[ans,early?"It will grow.":"The gentle push.",early?"It will melt.":"Both push it equally far."],answer:ans,scene:{world:"cart",model:{position:0},after:{position:early?2:5},description:"A toy car is waiting at the start."},clue:"Look at what the car did in the trial.",success:early?"The push started the car moving.":"Five tiles is farther than two."},
      {skill:"evidence",prompt:"Touch the observation that supports your prediction.",passage:text,evidence:true,choices:text,answer:text[text.length-1],clue:"Find the sentence that tells what happened to the car.",success:"You used a measured or observed result as evidence."}
    ];
  }
  if(trail==="groups") {
    const rows=3+(v===2?1:0),each=v===1?3:4;
    const desc=rows+" baskets, each holding "+each+" apples.";
    return [
      {skill:"baskets",prompt:"Show the first factor. Touch each basket once.",point:"baskets",points:rows,scene:{world:"orchard",model:{rows,each},description:desc},answer:String(rows),clue:"Follow the baskets from one side of the orchard to the other.",success:rows+" tells how many groups there are."},
      {skill:"each",prompt:"Show the second factor. Touch each apple in this one basket.",point:"apples",points:each,scene:{world:"orchard",model:{rows:1,each},description:"One basket with "+each+" apples."},answer:String(each),clue:"Count the apples in this single group.",success:each+" tells how many are in each group."},
      {skill:"total",prompt:"What does "+rows+" × "+each+" give you? Enter the total number of apples.",scene:{world:"orchard",model:{rows,each},description:desc},answer:String(rows*each),clue:"Count by "+each+" once for each basket.",success:rows+" groups × "+each+" in each = "+rows*each+" apples."}
    ];
  }
  if(trail==="trade") {
    const start=[43,54,62][v],take=[18,27,16][v];
    const base=[52,63,71][v], removed=[17,18,26][v], left=base-removed;
    const tens=Math.floor(base/10),ones=base%10,removeTens=Math.floor(removed/10),removeOnes=removed%10;
    const remainingTens=tens-1-removeTens;
    return [
      {skill:"jumps",prompt:"Start at 357. Jump back 200, then 40, then 5. Where do you land?",scene:{world:"river",model:{labels:["157","117","?","357"],position:1},after:{labels:["157","117","112","357"],position:2},description:"357 to 157 to 117. One jump of 5 left."},answer:"112",clue:"Start at 117 and count back five ones.",success:"357 − 245 = 112."},
      {skill:"exchange",prompt:"Build "+base+" − "+removed+". Tap the tray you can trade from to make ten more ones.",choices:["Hundreds","Tens","Ones"],answer:"Tens",guided:true,scene:{world:"blocks",model:{counts:[0,tens,ones]},after:{counts:[0,tens-1,ones+10]},description:base+" is "+tens+" tens and "+ones+" ones."},clue:"A ten can be exchanged for ten loose ones.",success:"The total is still "+base+". You now have "+(tens-1)+" tens and "+(ones+10)+" ones."},
      {skill:"remainder",prompt:"Now take away "+removeTens+" ten"+(removeTens===1?"":"s")+" and "+removeOnes+" ones. How much is left?",scene:{world:"blocks",model:{counts:[0,tens-1,ones+10]},after:{counts:[0,remainingTens,left%10]},description:(tens-1)+" tens and "+(ones+10)+" ones."},answer:String(left),clue:"Take "+removeOnes+" away from "+(ones+10)+" loose ones. Then remove "+removeTens+" ten(s).",scaffold:{prompt:"How many tens remain after you take away "+removeTens+"?",choices:[String(remainingTens),String(remainingTens+1),String(remainingTens+2)],answer:String(remainingTens)},success:remainingTens+" tens and "+left%10+" ones make "+left+"."},
      {skill:"transfer",prompt:"Your turn. What is "+start+" − "+take+"?",answer:String(start-take),clue:"Trade one ten. Count the ones again, then take away the tens and ones.",scaffold:{prompt:"After trading one ten, how many loose ones do you have?",choices:[String(start%10),String(10+start%10),"10"],answer:String(10+start%10)},success:start+" − "+take+" = "+(start-take)+"."}
    ];
  }
  if(trail==="round") {
    return [43+10*v,65+10*v].map(n=>{const lo=Math.floor(n/10)*10,hi=lo+10,ans=Math.round(n/10)*10;
      return {skill:"nearest",prompt:"Which ten is nearest to "+n+"?",choices:[String(lo),String(hi),String(hi+10)],answer:String(ans),scene:{world:"river",model:{labels:[String(lo),String(hi),String(hi+10),String(n)]},after:{labels:[String(lo),String(hi),String(hi+10),String(n)],position:ans===lo?0:1},description:"Choose a landing for "+n+"."},clue:"Compare the distance to each neighboring ten. Halfway goes to the higher ten.",success:n+" rounds to "+ans+"."};});
  }
  return [0,1].map(i=>{
    const a=2+(v+i)%3,b=level==="preschool"?1:2+i;
    const count=trail==="count";
    return {skill:count?"counting":"joining",prompt:count?"How many apples are in the basket?":"How many apples are in both baskets altogether?",scene:{world:"orchard",model:{rows:count?1:2,counts:count?[a]:[a,b]},description:count?a+" apples in one basket.":a+" in the first basket and "+b+" in the second."},answer:String(count?a:a+b),choices:[String(count?a:a+b),String(count?a+1:a+b+1),String(count?a-1:a+b-1)],clue:count?"Touch each apple once as you count.":"Count the first basket. Keep counting through the second.",success:count?"You counted "+a+" apples.":a+" plus "+b+" makes "+(a+b)+"."};
  });
}
