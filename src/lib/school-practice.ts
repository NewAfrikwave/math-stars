// Each lesson starts with a worked example. Its first question is guided.
export interface Check {
  prompt: string;
  answer: string;
  alternatives: string[];
  hint: string;
  why: string;
}
function check(prompt: string, answer: string, alternatives: string[], hint: string, why: string): Check {
  return { prompt, answer, alternatives, hint, why };
}
const number = (prompt: string, answer: number, hint: string, why: string) =>
  check(prompt, String(answer), [], hint, why);

export interface SchoolLesson {
  id: string;
  subject: "Math" | "Reading" | "Science" | "Kindness";
  title: string;
  example: string;
  model?: { labels: string[]; values: string[] };
  checks: Check[];
  writing?: { prompt: string; lookFor: string; sample: string };
}
export const lessons: SchoolLesson[] = [
  {
    id: "build-numbers", subject: "Math", title: "Build a three-digit number",
    example: "Build 342 with 3 hundreds, 4 tens and 2 ones. The 4 stands for 40. Adding 10 changes 342 to 352.",
    model: { labels: ["Hundreds", "Tens", "Ones"], values: ["3", "4", "2"] },
    checks: [
      number("How much are the 4 tens in 342 worth?", 40, "Count 10 four times.", "Four bundles of ten make 40."),
      number("Complete 263 = 200 + ___ + 3.", 60, "Read the middle digit.", "6 tens are 60."),
      number("Build a number with 5 hundreds, zero tens and 8 ones.", 508, "Leave a place for the empty tens.", "500 + 0 + 8 = 508.")
    ]
  },
  {
    id: "round", subject: "Math", title: "Find the nearest ten or hundred",
    example: "46 sits between 40 and 50. It is 6 steps from 40 and 4 from 50, so its nearest ten is 50. Halfway numbers round to the higher neighbor.",
    model: { labels: ["Lower ten", "Halfway", "Upper ten"], values: ["40", "45", "50"] },
    checks: [
      number("Round 43 to the nearest ten.", 40, "Which end is closer to 43?", "43 is only 3 away from 40."),
      number("Round 650 to the nearest hundred.", 700, "Find the two hundreds on either side.", "650 is halfway from 600 to 700, so round up."),
      number("Estimate 682 − 419 by rounding both to hundreds first.", 300, "Use the nearest hundred for each number.", "700 − 400 = 300.")
    ]
  },
  {
    id: "addition", subject: "Math", title: "Add with trades and hops",
    example: "For 268 + 156, start at 268. Hop 100 to 368, then 50 to 418, then 6 to 424. With blocks, 10 ones trade for 1 ten, and 10 tens trade for 1 hundred.",
    model: { labels: ["Start", "+100", "+50", "+6"], values: ["268", "368", "418", "424"] },
    checks: [
      number("Start at 385 and hop 30. Where do you land?", 415, "Hop 10 three times. Say each landing.", "395, 405, 415. The ones digit stays 5."),
      number("Find 247 + 185.", 432, "Add 100, then 80, then 5.", "247 → 347 → 427 → 432."),
      number("Find 47 + 26 + 13. Which two numbers make an easy ten first?", 86, "Pair 47 and 13.", "47 + 13 = 60. Add 26 to get 86.")
    ]
  },
  {
    id: "subtract", subject: "Math", title: "Subtract when a place needs more",
    example: "For 462 − 137, trade 1 ten for 10 ones. You now have 4 hundreds, 5 tens, 12 ones. Take away 1 hundred, 3 tens and 7 ones. That leaves 325.",
    model: { labels: ["Hundreds", "Tens", "Ones"], values: ["4", "5", "12"] },
    checks: [
      number("Trade one ten in 351. How many ones do you have now?", 11, "Keep the 1 one and add 10 more.", "351 has the same value as 3 hundreds, 4 tens and 11 ones."),
      number("What is 634 − 218?", 416, "Trade a ten so you can take 8 from 14.", "14 − 8 = 6, 2 tens − 1 ten = 1 ten, and 6 hundreds − 2 hundreds = 4 hundreds."),
      number("What is 402 − 156?", 246, "Trade 1 hundred for 10 tens. Trade one of those tens for 10 ones.", "3 hundreds, 9 tens and 12 ones minus 1 hundred, 5 tens and 6 ones leaves 246.")
    ]
  },
  {
    id: "adjust", subject: "Math", title: "Use friendly numbers and check",
    example: "For 671 − 298, taking away 300 is easy. That gives 371. You took away 2 too many, so put 2 back. The exact answer is 373.",
    checks: [
      number("For 754 − 296, subtract 300. How much should you put back?", 4, "Count from 296 to 300.", "296 + 4 = 300. Add back 4 to undo the extra subtraction."),
      number("Find 428 + 197 using 200.", 625, "Add 200, then remove the extra amount.", "628 − 3 = 625."),
      number("A mystery number minus 234 equals 152. Find the starting number.", 386, "Put the amount taken away back with what remained.", "234 + 152 = 386. Check by subtracting 234.")
    ]
  },
  {
    id: "stories", subject: "Math", title: "What is the story asking?",
    example: "A book has 120 pages. You read 20 pages and then 15. First combine the pages read. Then take 35 away from the whole book. There are 85 pages left.",
    checks: [
      check("A shelf has 90 books. Of those, 38 are poems. Which expression finds the other books?", "90 − 38", ["90 + 38", "38 − 90"], "Which number already includes all the books?", "90 is the whole shelf. Remove the known part."),
      number("A reader has 156 pages to read. She reads 24, then 32. How many are left?", 100, "How many pages did she finish altogether?", "24 + 32 = 56. Then 156 − 56 = 100."),
      number("Four nickels and three dimes are in a jar. How many cents is that?", 50, "A nickel is 5 cents. A dime is 10 cents.", "4 × 5 = 20 cents. Add 3 × 10 = 30 cents.")
    ]
  },
  {
    id: "groups", subject: "Math", title: "Read an array and explain the factors",
    example: "These rows each hold 4 stars. Three equal rows give 4 + 4 + 4, or 3 × 4 = 12. Looking down the columns gives 4 groups of 3.",
    model: { labels: ["Row 1", "Row 2", "Row 3"], values: ["★★★★", "★★★★", "★★★★"] },
    checks: [
      number("How many stars are in one row of the model?", 4, "Read just one box.", "4 tells the size of each group."),
      number("A tray has 4 rows of 6 buttons. How many buttons?", 24, "Hop by 6 for each row.", "6, 12, 18, 24. Four equal hops land on 24."),
      check("Which sum shows 5 bags with 2 marbles in each?", "2 + 2 + 2 + 2 + 2", ["5 + 2", "5 + 5 + 5 + 5 + 5"], "Give each bag one term.", "There are five 2s, one for each bag.")
    ]
  },
  {
    id: "facts", subject: "Math", title: "Multiples, missing factors and zero",
    example: "Four teams of 3 players make 12. In ___ × 3 = 12, count how many jumps of 3 reach 12. A team with zero players contributes zero.",
    checks: [
      number("How many groups of 4 make 20?", 5, "Count 4, 8, 12…", "Five hops of 4 reach 20."),
      check("Which pair of facts is true?", "7 × 0 = 0 and 7 × 1 = 7", ["7 × 0 = 7 and 7 × 1 = 1", "7 × 0 = 1 and 7 × 1 = 0"], "Picture seven empty cups. Now put one bead in each.", "Zero in each cup gives zero. One in each gives seven."),
      check("Which total can make teams of 4 with nobody left over?", "28", ["26", "30"], "Count in jumps of 4.", "7 × 4 = 28.")
    ]
  },
  ...[
    ["spoon", "smell", "ski", "spill", "skip"],
    ["skirt", "smock", "spear", "skunk", "spool"],
    ["sponge", "smoke", "skull", "skeleton", "skateboard"],
  ].map((words, index): SchoolLesson => ({
    id: "blend-" + (index + 1), subject: "Reading", title: "Sort beginning blends · Set " + (index + 1),
    example: "Say spin slowly. Hear s and p together at the start. Try small and skin next. Listen for the sound right after s.",
    checks: words.map(word => check(
      "Which blend starts “" + word + "”?", word.slice(0, 2),
      ["sp", "sm", "sk"].filter(blend => !word.startsWith(blend)),
      "Say the word slowly. Look at the first two letters.",
      word + " begins with " + word.slice(0, 2) + ". Read it aloud, then try it in a sentence."
    )),
  })),
  {
    id: "ocean-words", subject: "Reading", title: "Find the clue beside a new word",
    example: "An exoskeleton is a stiff support on the outside of an animal. The word part exo- means outside. Read the words near a new word to find its meaning.",
    checks: [
      check("A polyp, a tiny coral animal, catches food. Which words explain polyp?", "a tiny coral animal", ["catches food", "a stiff support"], "Look between the commas.", "The writer names the animal and then explains the name."),
      check("A diver researches a mystery. What is she doing?", "Gathering information about something hard to explain", ["Hiding something underwater", "Remembering every animal name"], "Think about what a scientist wants to learn.", "Research gathers information. A mystery is something we do not yet understand."),
      check("Which pair includes a living and a nonliving part of a reef ecosystem?", "A fish and the water", ["A fish and a polyp", "Water and a rock"], "Which one is alive?", "An ecosystem includes organisms and their physical surroundings.")
    ]
  },
  {
    id: "reef", subject: "Reading", title: "Read a reef paragraph and find evidence",
    example: "A reef is home to many animals. Small fish hide in cracks in the reef. At night, coral polyps stretch out tentacles to catch tiny animals. Reef animals find both shelter and food here.",
    checks: [
      check("What idea fits the whole paragraph?", "A reef helps animals meet their needs.", ["All reef animals hunt at night.", "Small fish build the reef."], "Think of both the fish and the polyps.", "Hiding and feeding are two different ways the reef supports life."),
      check("Which detail shows how the reef provides shelter?", "Small fish hide in cracks.", ["Polyps stretch out tentacles.", "Polyps catch tiny animals."], "Shelter means a place to stay safe.", "A crack gives a fish a hiding place."),
      check("When a polyp catches a tiny animal, which one is the prey?", "The tiny animal", ["The polyp", "The reef"], "Which animal is being caught?", "In this example the polyp is the predator and the animal it catches is prey.")
    ],
    writing: { prompt: "How does the reef help animals? Say your answer aloud, then write three sentences. Give two details.", lookFor: "Did I answer the question and give a detail about shelter and a detail about food?", sample: "A reef helps animals survive. Fish hide in its cracks. Coral polyps catch tiny animals with their tentacles." }
  },
  {
    id: "reef-sequence", subject: "Reading", title: "Read aloud and put events in order",
    example: "Read this aloud in short phrases. A young hard coral settles on a rock. It builds a hard skeleton as it grows. The skeleton stays behind when the coral dies. Over time, new corals grow above the old layers.",
    checks: [
      check("What happens first in the passage?", "A young coral settles on rock.", ["New corals grow over old layers.", "The skeleton stays behind."], "Reread the first event.", "The coral settles before it builds its skeleton."),
      check("Which part can stay behind after hard coral dies?", "The hard skeleton", ["Its living tentacles", "Its food"], "Look at the third event.", "Old skeletons become part of the reef."),
      check("Why can a reef get thicker over time?", "New corals grow above older layers.", ["Each layer washes away first.", "Tiny fish turn into rocks."], "Picture one layer building on another.", "Skeletons from many generations contribute to the reef.")
    ]
  },
  {
    id: "caption", subject: "Reading", title: "Look closely and read the caption",
    example: "Compare the two drawings. Each star stands for one open flower. Caption: These garden flowers open when sunlight reaches them.",
    model: { labels: ["Early morning", "Midday"], values: ["★", "★ ★ ★ ★"] },
    checks: [
      check("Which detail comes from the drawings?", "More flowers are open at midday.", ["The flowers smell sweet.", "Bees prefer these flowers."], "Count the stars in each picture.", "The pictures show one open flower early and four at midday."),
      check("What extra clue comes from the caption?", "Sunlight helps the flowers open.", ["The flowers grow beside water.", "The flowers are red."], "Read the sentence that begins with These.", "The caption tells what helps explain the change."),
      check("A coral photo has the caption “At night its tentacles reach outward.” Which observation fits?", "Tentacles extend at night.", ["The reef gets smaller at night.", "All corals look alike."], "Use only what this caption describes.", "The caption tells when the tentacles extend.")
    ],
    writing: { prompt: "Write one thing you notice in the drawings and one question you still wonder about.", lookFor: "Can someone point to my observation? Does my question ask about something I still want to learn?", sample: "I notice that more flowers are open at midday. I wonder when they close again." }
  },
  {
    id: "pushes", subject: "Science", title: "See when forces change motion",
    example: "A book rests on a desk. Gravity pulls it down and the desk pushes it up. These forces balance. Balanced forces keep motion the same. An unbalanced force can start, stop, speed up, slow down or turn an object.",
    model: { labels: ["Desk pushes", "Gravity pulls"], values: ["↑ up", "↓ down"] },
    checks: [
      check("Two equal pushes act in opposite directions on a resting cart. What happens?", "It stays still.", ["It speeds up.", "It must turn."], "Compare the sizes and directions.", "The pushes cancel. The cart's motion stays the same."),
      check("A bike moves straight at steady speed. What happens if its forces stay balanced?", "Its speed and direction stay the same.", ["It must stop immediately.", "It turns left."], "Think about whether its motion changes.", "Balanced forces also work on moving objects."),
      check("A rolling ball slows on a rough mat. Which force resists its movement?", "Friction", ["Gravity pointing sideways", "A larger forward push"], "Look where the mat touches the ball.", "Friction opposes sliding or rolling motion here.")
    ]
  },
  {
    id: "motion-data", subject: "Science", title: "Predict from a motion pattern",
    example: "A swing moves back and forth. A wheel turns in circles. For a spinner, count turns during equal spans of time. Fewer turns each time means it is slowing down.",
    model: { labels: ["First 5 seconds", "Next 5", "Next 5"], values: ["11 turns", "8 turns", "5 turns"] },
    checks: [
      check("What motion repeats on a seesaw?", "Up and down", ["Only forward", "Around a circle"], "Watch one seat.", "Each seat rises and falls."),
      number("Use the table. If the pattern continues for one more interval, how many turns?", 2, "How many fewer turns are there at each step?", "11, 8, 5, 2. Subtract 3 each time."),
      check("What evidence tells you the spinner slowed?", "It made fewer turns in equal time.", ["We counted three times.", "The clock kept moving."], "Compare the counts and the lengths of time.", "When each interval lasts five seconds, fewer turns means lower average speed.")
    ]
  },
  {
    id: "fair-test", subject: "Science", title: "Predict, observe and explain a fair test",
    example: "Two trials use the same toy car and floor. A gentle push sends the car 2 tiles. A stronger push sends it 5 tiles. The push is what changed. The distance is what we observed.",
    model: { labels: ["Gentle push", "Stronger push"], values: ["2 tiles", "5 tiles"] },
    checks: [
      check("Which variable did the experimenter change?", "Strength of the push", ["Which car was used", "Type of floor"], "Which part was different on purpose?", "Only the push changed between these trials."),
      check("Which statement is an observation?", "The car went 5 tiles in trial two.", ["I think it will go farther.", "Maybe it will turn."], "Find something already measured.", "An observation reports what happened. A prediction comes before the trial."),
      check("What would make the next comparison fair?", "Keep the same car and surface.", ["Change the car and floor together.", "Guess the distance without measuring."], "Change one thing at a time.", "Keeping other conditions alike helps us compare the effect of the push.")
    ],
    writing: { prompt: "What happened when the push changed? Give evidence from both trials.", lookFor: "Did I name what changed and use both distances?", sample: "The car went farther with the stronger push. It went 5 tiles instead of 2." }
  },
  {
    id: "kindness", subject: "Kindness", title: "Try the Golden Rule",
    example: "Think about how you would like to be treated. If a classmate drops their crayons, you can ask whether they would like help.",
    checks: [
      check("A new student is alone at lunch. What could you say?", "Would you like to sit with us?", ["You have to sit here.", "You cannot join us."], "Offer a friendly choice.", "An invitation helps someone feel welcome."),
      check("A friend says they would like to try a puzzle alone. What can you do?", "Give them space and offer help later.", ["Finish it for them.", "Tell them to hurry."], "Listen to what your friend wants.", "Respecting a choice can be a kind action.")
    ]
  }
];
