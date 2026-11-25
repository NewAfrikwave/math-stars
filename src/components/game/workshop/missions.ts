export type World = "blocks" | "river" | "orchard" | "cart" | "spinner" | "reef" | "garden" | "docks" | "playground";
export type Model = { counts?: number[]; position?: number; labels?: string[]; rows?: number; each?: number; night?: boolean; turns?: number };
export interface Move { label: string; result: string; model: Model; }
export interface Challenge {
  prompt: string;
  start: Model;
  moves: Move[];
  answer: number;
}
export interface Mission { title: string; world: World; rounds: Challenge[]; }
const move = (label: string, result: string, model: Model = {}): Move => ({ label, result, model });
const task = (prompt: string, start: Model, moves: Move[], answer: number): Challenge => ({ prompt, start, moves, answer });

function river(prompt: string, labels: string[], answer: number, explanation: string, clue: string, startLabel: string): Challenge {
  return task(prompt, { labels: [...labels, startLabel], position: -1 }, labels.map((label,i) => move("Hop to " + label, i === answer ? explanation : clue, {position:i})), answer);
}
const array = (rows: number, each: number) => ({ rows, each });
function orchard(rows: number, target: number): Challenge {
  return task("Pack " + rows + " baskets with " + target + " apples in each. Choose how many to put in every basket.", array(rows,0),
    [target-1,target+1,target].map(n => move("Give each basket " + n, n === target ? rows + " equal groups of " + n + " make " + rows*n + " apples." : "Count just one basket. It needs " + target + " apples.", array(rows,n))), 2);
}
const coast = (prompt: string, answer: number, reasons: string[]): Challenge => task(prompt, {}, ["Coral polyp","Reef fish","Water"].map((label,i) => move(label,reasons[i],{position:i})),answer);
function flowers(prompt: string, answer: number): Challenge {
  return task(prompt, { night:true }, ["Early morning","Midday"].map((label,i) =>
    move(label, i === answer ? (i ? "Four blossoms are open in the midday sun." : "One blossom is open early in the morning.") : "Count the open blossoms and try the other time.", { night: i === 0 })), answer);
}
export function blendMission(words: string[]): Mission {
  const blends = ["sp","sm","sk"];
  return {world:"docks",title:"Word Cargo",rounds:words.map(word => task("Deliver “" + word + "” to its sound dock.",{labels:blends,position:-1},
    blends.map((blend,i) => move(blend.toUpperCase() + " dock", word.startsWith(blend) ? "Delivered! Say " + word + " slowly and listen for " + blend + "." : "Listen for the second sound in " + word + ".", {position:i})),blends.indexOf(word.slice(0,2))))};
}
const carTrials = (fair: boolean): Challenge[] => [
  task(fair ? "Try two pushes. Which one rolls the same cart farther?" : "The cart is resting. Which pair of pushes starts it rolling right?",
    {position:0}, [
      move(fair ? "Gentle push" : "Equal opposite pushes",fair ? "The cart rolled 2 tiles. Try the stronger push and compare." : "The pushes cancel, so the cart stays still.",{position:fair ? 2 : 0}),
      move(fair ? "Stronger push" : "Stronger push to the right",fair ? "The cart rolled 5 tiles with the stronger push." : "The stronger rightward push changes the cart’s motion.",{position:5})],1),
  task(fair ? "Pick the next fair trial. Which run lets us compare push strength?" : "Can you keep this resting cart at the starting flag?",{position:0},[
    move(fair ? "Same car and floor, gentle push" : "Balance the pushes",fair ? "The same car went 2 tiles on the same floor. Only the push changed." : "Equal opposite pushes keep this resting cart at the flag.",{position:fair?2:0}),
    move(fair ? "Change both car and floor" : "Push harder to the right",fair ? "Two things changed. We could not tell which caused the difference." : "The cart moved past the flag. Try pushes that cancel.",{position:fair?1:5})],0)
];
export const missions: Record<string,Mission> = {
  round: {world:"river",title:"Rounding Rapids",rounds:[
    river("Pip is at 47. Hop to the nearest ten.",["40","50","60"],1,"47 is only 3 steps from 50.","Count the distance from 47 to each ten.","47"),
    river("Pip is at 630. Hop to the nearest hundred.",["600","700","800"],0,"630 is 30 away from 600.","Find the two hundreds around 630.","630")]},
  addition: {world:"river",title:"Hop the River",rounds:[
    river("Start at 268. Hop forward 100.",["278","368","468"],1,"268 + 100 = 368. Only the hundreds changed.","A hundred hop keeps the tens and ones.","268"),
    river("From 368, hop forward 50.",["373","408","418"],2,"Five tens take you to 418.","Count 378, 388, 398…","368"),
    river("From 418, hop forward 6.",["424","478","412"],0,"You crossed the river! 268 + 156 = 424.","Count forward six ones.","418")]},
  adjust: {world:"river",title:"Make a Friendly Hop",rounds:[
    river("From 671, jump back 300 to start finding 671 − 298.",["371","471","971"],0,"671 − 300 = 371.","Move back three hundreds.","671"),
    river("You took away 2 too many. Where should Pip hop from 371?",["369","391","373"],2,"Putting 2 back gives 373.","Undo the extra subtraction by moving forward.","371")]},
  stories: {world:"river",title:"Book Bridge",rounds:[
    river("A book has 120 pages. Hop to the page you reach after reading 20 pages and then 15 more.",["5","35","85"],1,"20 + 15 = 35 pages read.","Combine the two parts you read.","0"),
    river("Out of 120 pages, 35 are read. Jump to the number left.",["85","155","35"],0,"35 read and 85 left make 120.","Take the pages read away from the whole book.","120")]},
  groups: {world:"orchard",title:"Pack the Apple Baskets",rounds:[orchard(3,4),orchard(4,2)]},
  facts: {world:"orchard",title:"Find the Missing Harvest",rounds:[
    task("Fill three baskets with 12 apples altogether. How many go in each?",array(3,0),[3,4,5].map(n=>move(n+" per basket",n===4?"3 × 4 = 12. The baskets are ready!":"Count the apples across all three baskets.",array(3,n))),1),
    task("An empty harvest has three baskets and zero apples. Build it.",array(3,1),[0,1,3].map(n=>move(n+" per basket",n===0?"3 × 0 = 0. All three baskets are empty.":"Each basket should be empty.",array(3,n))),0)]},
  "ocean-words": {world:"reef",title:"Dive for Word Clues",rounds:[
    coast("Find the tiny animal that catches food with tentacles.",0,["You found the coral polyp. Its tentacles can catch tiny prey.","This fish has fins. Look for tentacles.","Water is the nonliving surroundings."]),
    coast("Find a nonliving part of the ecosystem.",2,["The polyp is an animal.","The fish is alive.","The water is part of the ecosystem too."])]},
  reef: {world:"reef",title:"Reef Explorer",rounds:[
    coast("Find the animal that can hide in a crack in the reef.",1,["Find the animal with fins in our reef paragraph.","The small fish uses the reef for shelter.","Water fills the crack. Which animal hides there?"]),
    coast("Find the animal that can reach out to catch food with tentacles.",0,["The polyp uses the reef as a place to feed.","Look for tentacles beside the fish.","Find a living animal."])]},
  "reef-sequence": {world:"reef",title:"Grow a Little Reef",rounds:[
    task("What should happen first to start this reef?",{rows:0},[move("Settle a polyp","The young coral settles on rock.",{rows:1}),move("Stack old skeletons","Start with the living coral that builds a skeleton.",{rows:0})],0),
    task("An old coral has left its skeleton. What can build the next layer?",{rows:1},[move("Sweep away the rock","A new layer needs a base.",{rows:1}),move("Grow new coral on top","New coral grows above old skeletons. The reef gets thicker.",{rows:3})],1)]},
  caption: {world:"garden",title:"Turn the Garden Clock",rounds:[flowers("Find the time when four flowers are open.",1),flowers("Turn back to the time when only one flower is open.",0)]},
  pushes: {world:"cart",title:"Push the Moon Buggy",rounds:carTrials(false)},
  "fair-test": {world:"cart",title:"Moon Buggy Test Track",rounds:carTrials(true)},
  "motion-data": {world:"spinner",title:"Spin Detective",rounds:[
    task("The ride made 11, 8, then 5 turns in equal time spans. Choose the next count and watch that many turns.",{turns:0},[2,5,8].map(n=>move(n+" turns",n===2?"Each count drops by 3. The next count is 2.":"Compare 11 to 8 and 8 to 5. How much is lost?",{turns:n})),0),
    task("Try the count that shows a slower ride than 5 turns in the same time.",{turns:5},[7,3,6].map(n=>move(n+" turns",n===3?"Fewer turns in the same time means slower.":"A slower ride makes fewer turns in equal time.",{turns:n})),1)]},
  kindness: {world:"playground",title:"Make Room on the Bench",rounds:[
    task("A child wants to join your picnic. What could you do?",{position:0},[move("Keep the seat blocked","Try making the space welcoming.",{position:0}),move("Invite them to sit","An invitation gives them a choice. They join the picnic.",{position:1})],1),
    task("Your friend wants a little space. What can you do?",{position:1},[move("Give them room","Listening is a kind choice.",{position:0}),move("Crowd closer","Listen to what your friend asked for.",{position:1})],0)]}
};
