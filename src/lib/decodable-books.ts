// Child-facing text is original. Each set revisits its new spelling in three short books.
export interface LittleBook {
  id: string;
  title: string;
  word: string;
  tiles: string[];
  distractor: string;
  lines: string[];
  question: string;
  choices: string[];
  proof: number;
}
function book(id:string, title:string, tiles:string, distractor:string, lines:string[], question:string, choices:string[], proof:number):LittleBook {
  const parts=tiles.split(" ");
  return {id,title,word:parts.join(""),tiles:parts,distractor,lines,question,choices,proof};
}
export const bookSets = [
  { id:"short-a", name:"Short a", example:"mat", mark:"a", icon:"🐈", books:[
    book("cat-mat","A Mat for Cat","c a t","p",["A cat sat on a mat.","Sam sat on the mat.","The cat sat on Sam."],"Where did the cat sit at the end?",["On Sam","On a cap","On a bag"],2),
    book("cap","The Cap","c a p","t",["Sam has a cap.","A cat sat in the cap.","Sam pats the cat."],"What did the cat use as a seat?",["The cap","A mat","A pan"],1),
    book("bag","The Bag","b a g","t",["Pam has a bag.","A map is in the bag.","Pam taps the map."],"What did Pam keep in her bag?",["A map","A cap","A bat"],1)
  ]},
  { id:"short-i", name:"Short i", example:"sit", mark:"i", icon:"🐷", books:[
    book("pig","Pip and the Pig","p i g","n",["Pip sits in a pit.","A pig sits by Pip.","Pip pats his pal."],"Who sat beside Pip?",["A pig","Sam","A cat"],1),
    book("lid","The Tin Lid","l i d","p",["Pip has a tin.","The lid is in a bag.","Pip fits the lid on the tin."],"Where did Pip find the lid?",["In a bag","On a mat","In a pit"],1),
    book("fin","A Fin","f i n","t",["Tim sits by a pond.","A fin tips up.","Tim can spot it."],"What did Tim see in the water?",["A fin","A pin","A lid"],1)
  ]},
  { id:"short-o", name:"Short o", example:"top", mark:"o", icon:"🪵", books:[
    book("log","On a Log","l o g","p",["Tom sits on a log.","A bug hops on Tom.","Tom hops off the log."],"What made Tom hop off?",["A bug landed on him","The log was hot","The log rolled"],1),
    book("pot","The Hot Pot","p o t","d",["Dot has a pot.","The pot is hot.","Dot sets it on a mat."],"Why did Dot use a mat?",["The pot was hot","The mat was wet","The pot had a lid"],1),
    book("box","In the Box","b o x","t",["A box is on a mat.","A top is in the box.","Tom spins the top."],"What toy did Tom find?",["A top","A bat","A drum"],1)
  ]},
  { id:"short-e", name:"Short e", example:"pen", mark:"e", icon:"🐔", books:[
    book("hen","The Red Hen","h e n","t",["A red hen is in a pen.","The hen sits on an egg.","Ben sets a dish by the hen."],"What did the hen sit on?",["An egg","A lid","A bin"],1),
    book("net","The Net","n e t","p",["Ben has a net.","A red bug sits in it.","Ben tips the bug onto a log."],"Where did the bug end up?",["On a log","In a tin","On Ben"],2),
    book("bed","A Bed for Pip","b e d","g",["Pip is a pet.","Meg sets a mat in a box.","Pip naps in his bed."],"How did Meg make a bed?",["She put a mat in a box","She put a cap on Pip","She dug a pit"],1)
  ]},
  { id:"short-u", name:"Short u", example:"cup", mark:"u", icon:"🐾", books:[
    book("pup","A Pup in Mud","p u p","t",["A pup runs in mud.","Meg fills a tub.","The pup sits in the tub."],"Why might Meg want to wash the pup?",["It ran in mud","It lost a cap","It sat on a mat"],0),
    book("sun","In the Sun","s u n","b",["A wet rug is on a log.","The sun is hot.","At dusk the rug is dry."],"What helped the wet rug dry?",["The hot sun","A tub of mud","A wet net"],1),
    book("nut","The Nut","n u t","p",["Gus has a nut.","He tucks it in a cup.","A bug sits on the cup."],"Where did Gus hide the nut?",["In a cup","In a bag","In a tub"],1)
  ]},
  { id:"sh", name:"Two letters, one sound: sh", example:"shop", mark:"sh", icon:"🐟", books:[
    book("fish","A Fish for Pip","f i sh","s",["Pip has a dish.","Dad puts a fish in the dish.","Pip sniffs it."],"What did Dad put in the dish?",["A fish","A nut","A bun"],1),
    book("ship","The Red Ship","sh i p","t",["A red ship is in the tub.","Meg taps it.","The ship bumps the rim."],"What set the ship moving?",["Meg tapped it","A pup pushed it","The tub tipped"],1),
    book("shed","In the Shed","sh e d","n",["A shed has a shut door.","Sam tugs it open.","His net is in the shed."],"What did Sam find inside?",["His net","A ship","His hat"],2)
  ]},
  { id:"ch", name:"Two letters, one sound: ch", example:"chat", mark:"ch", icon:"🐣", books:[
    book("chin","Jam on a Chin","ch i n","t",["Chip has jam on a bun.","Jam drips on his chin.","Chip gets a wet rag."],"Why did Chip get a rag?",["Jam dripped on his chin","His bun was hot","His cup was wet"],1),
    book("chop","Chop It Up","ch o p","t",["Dad has a big yam.","Dad can chop it into bits.","The bits fit in the pot."],"How did Dad make the yam fit?",["He cut it into bits","He sat on the lid","He got a big cup"],1),
    book("chip","The Chip","ch i p","n",["A chip of wood is in a box.","Jen puts it in the tub.","The chip bobs on top."],"What happened in the tub?",["The chip floated","The box fell in","The chip got hot"],2)
  ]},
  { id:"ck", name:"The ending ck", example:"back", mark:"ck", icon:"🦆", books:[
    book("duck","A Duck at the Dock","d u ck","p",["A duck sits on the dock.","A pup runs up.","The duck hops into the pond."],"Where did the duck go when the pup came?",["Into the pond","Into a shed","Onto a log"],2),
    book("sock","The Lost Sock","s o ck","t",["Nick has just one sock.","He peeks in his pack.","The lost sock is at the bottom."],"Where was Nick’s missing sock?",["In his pack","On the dock","In his bed"],2),
    book("rock","The Flat Rock","r o ck","p",["A flat rock sits in the mud.","Jack steps on the rock.","His sock is still dry."],"What kept Jack out of the mud?",["Stepping on the rock","Sitting on the dock","Getting a wet rag"],1)
  ]}
];
export type BookSet = (typeof bookSets)[number];
export const pages = ["word","meaning","evidence"] as const;
export type Page = typeof pages[number];
export function bookKey(id:string,page:Page) {return "book/"+id+"/"+page;}
export function nextUnread(has:(key:string)=>boolean) {
  return bookSets.flatMap(set=>set.books).find(b=>!has(bookKey(b.id,"evidence")));
}
export function setFinished(set:BookSet,has:(key:string)=>boolean) {
  return set.books.every(b=>has(bookKey(b.id,"evidence")));
}

// Words that use a later spelling or an irregular high-frequency spelling can
// be heard individually, so the child can keep reading the rest of the line.
const supportedWords=new Set([
  "a","the","is","has","his","on","in","by","up","of","as","to","he","one",
  "pond","bug","hops","off","it","sits","tips","fits","spins","spots","spot",
  "sniffs","door","open","puts","wood","into","onto","just","peeks","bottom",
  "one","still","dry","at","dusk","rug","wet","log","and","from","tucks"
]);
export function storyHelpers(book:LittleBook) {
  const words=book.lines.join(" ").toLowerCase().match(/[a-z]+/g)??[];
  return [...new Set(words.filter(w=>w!==book.word && supportedWords.has(w)))];
}
