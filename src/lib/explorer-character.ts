import type { Journal } from "./explorer";
import { bookSets, bookKey } from "./decodable-books";

export const choices = {
  skin: { porcelain: "#ffdfc4", honey: "#e9ac79", sienna: "#bd7951", copper: "#975c3c", umber: "#74432e", ebony: "#4d3028" },
  hairstyle: { crop: "Crop", curls: "Curls", puffs: "Puffs", sweep: "Side sweep", shaved: "Shaved" },
  hair: { espresso: "#382523", chestnut: "#764635", blond: "#e6b653", silver: "#babcc7", violet: "#725594" },
  shirt: { lagoon: "#16867f", berry: "#b54271", sky: "#416db6", amber: "#c47a16", plum: "#7e52a5" },
  gear: { none: "No accessory", scarf: "Explorer scarf", pin: "Star pin", glasses: "Reader glasses", crown: "Trail crown" },
} as const;
export type Part = keyof typeof choices;
export type Character = { [K in Part]: keyof (typeof choices)[K] & string };
export const starter: Character = { skin: "sienna", hairstyle: "curls", hair: "espresso", shirt: "lagoon", gear: "scarf" };
export const parts = Object.keys(starter) as Part[];

export function validCharacterPart(part: string, value: string) {
  return Object.hasOwn(choices, part) && Object.hasOwn(choices[part as Part], value);
}

export function characterRewards(entries: Journal, stars: number) {
  const readBook = bookSets.some(set => set.books.some(book => !!entries[bookKey(book.id, "evidence")]));
  const stickers = Object.keys(entries).filter(key => key.startsWith("stamp/") && entries[key].value === "earned").length;
  return {
    none: { available: true, goal: "" },
    scarf: { available: true, goal: "" },
    pin: { available: stars >= 1, goal: "Earn your first lesson star" },
    glasses: { available: readBook, goal: "Finish a bookshelf story" },
    crown: { available: stickers >= 3, goal: "Collect 3 different adventure stickers (" + Math.min(3, stickers) + "/3)" },
  };
}

export function readCharacter(entries: Journal, stars: number): Character {
  function part<K extends Part>(key: K): Character[K] {
    const id = entries["character/" + key]?.value;
    return id && validCharacterPart(key, id) ? id as Character[K] : starter[key];
  }
  const gear = part("gear");
  return {
    skin: part("skin"), hairstyle: part("hairstyle"), hair: part("hair"), shirt: part("shirt"),
    gear: characterRewards(entries, stars)[gear].available ? gear : starter.gear,
  };
}
