import { CURRICULUM } from "@/lib/curriculum";
import { PRESCHOOL_CURRICULUM } from "@/lib/preschool";
import { GRADE1_CURRICULUM } from "@/lib/grade1";
import { GRADE2_CURRICULUM } from "@/lib/grade2";
import { GRADE4_CURRICULUM } from "@/lib/grade4";
import { ARCADE_GAMES } from "@/lib/arcade";
import { OFFLINE_PACK_VERSION } from "@/lib/offline/types";
import type { Level } from "@/lib/types";

const GRADE_DEFINITIONS = {
  preschool: { label: "Preschool", curricula: PRESCHOOL_CURRICULUM },
  grade1: { label: "Grade 1", curricula: GRADE1_CURRICULUM },
  grade2: { label: "Grade 2", curricula: GRADE2_CURRICULUM },
  grade3: { label: "Grade 3", curricula: CURRICULUM },
  grade4: { label: "Grade 4", curricula: GRADE4_CURRICULUM },
} as const;

export const OFFLINE_LEVELS = Object.keys(GRADE_DEFINITIONS) as Level[];

const CORE_ASSETS = [
  "/",
  "/manifest.json",
  "/brand/math-stars-icon-192.png",
  "/brand/math-stars-logo.png",
  "/pip-tutor.webp",
  "/learner-fox.webp",
  "/learner-owl.webp",
  "/arcade-math-race-v2.webp",
  "/arcade-treasure-hunt-v2.webp",
  "/arcade-rocket-builder-v2.webp",
];

export function isOfflineLevel(value: string): value is Level {
  return value in GRADE_DEFINITIONS;
}

export function buildGradePack(level: Level) {
  const definition = GRADE_DEFINITIONS[level];
  const lessons = definition.curricula.flatMap((domain) => domain.lessons.map((lesson) => ({
    ...lesson,
    domainId: domain.id,
    domainTitle: domain.title,
    spokenText: [lesson.title, lesson.subtitle, ...lesson.teach.flatMap((block) => [block.text, block.question, block.answer]).filter(Boolean)].join(". "),
    offlineHints: lesson.teach.flatMap((block) => [block.text, block.answer]).filter((value): value is string => Boolean(value)).slice(0, 3),
  })));
  const payload = {
    level,
    label: definition.label,
    version: OFFLINE_PACK_VERSION,
    lessonCount: lessons.length,
    assets: [...CORE_ASSETS, `/api/offline/packs/${level}`],
    lessons,
    arcadeGames: ARCADE_GAMES,
  };
  return { ...payload, estimatedBytes: new TextEncoder().encode(JSON.stringify(payload)).byteLength };
}

export function listGradePackMetadata() {
  return OFFLINE_LEVELS.map((level) => {
    const pack = buildGradePack(level);
    return { level, label: pack.label, version: pack.version, lessonCount: pack.lessonCount, estimatedBytes: pack.estimatedBytes };
  });
}
