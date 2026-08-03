"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  Printer,
  RefreshCw,
  Eye,
  EyeOff,
  FileText,
} from "lucide-react";
import type { Problem } from "@/lib/types";
import { CURRICULUM, findLesson } from "@/lib/curriculum";
import { PRESCHOOL_CURRICULUM, findPsLesson } from "@/lib/preschool";
import { GRADE1_CURRICULUM, findG1Lesson } from "@/lib/grade1";
import { GRADE2_CURRICULUM, findG2Lesson } from "@/lib/grade2";
import { GRADE4_CURRICULUM, findG4Lesson } from "@/lib/grade4";
import { generateProblems } from "@/lib/generators";
import { useGameStore } from "@/store/useGameStore";
import { cn } from "@/lib/utils";

// Printable worksheet generator. Produces a fixed problem set with an answer
// key, laid out for printing (via window.print()) on plain paper.
export function WorksheetView({ lessonId }: { lessonId?: string }) {
  const setView = useGameStore((s) => s.setView);

  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(lessonId ?? null);
  const [seed, setSeed] = useState(0); // bump to regenerate
  const [showAnswers, setShowAnswers] = useState(false);

  const found = selectedLessonId ? (findLesson(selectedLessonId) ?? findPsLesson(selectedLessonId) ?? findG1Lesson(selectedLessonId) ?? findG2Lesson(selectedLessonId) ?? findG4Lesson(selectedLessonId)) : null;

  const problems = useMemo<Problem[]>(() => {
    if (!found) return [];
    return generateProblems(found.lesson, 12);
  }, [selectedLessonId, seed]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-28 pt-6">
      <div className="print:hidden">
        <Button variant="ghost" size="sm" onClick={() => setView({ name: "home" })} className="mb-4 gap-1">
          <ArrowLeft className="h-4 w-4" /> Home
        </Button>

        <div className="rounded-3xl bg-gradient-to-br from-sky-500 to-cyan-500 p-6 text-white shadow-lg">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/25 text-4xl backdrop-blur">
              🖨️
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold sm:text-3xl">Printable Worksheets</h1>
              <p className="text-sm text-white/90">
                Pick a lesson, then print a practice sheet with an answer key — perfect for offline time!
              </p>
            </div>
          </div>
        </div>

        {/* Lesson picker */}
        <Card className="mt-6 p-4">
          <p className="mb-2 font-display font-bold">Choose a lesson:</p>
          <div className="nice-scroll max-h-72 space-y-1 overflow-y-auto pr-1">
            {[...CURRICULUM, ...PRESCHOOL_CURRICULUM, ...GRADE1_CURRICULUM, ...GRADE2_CURRICULUM, ...GRADE4_CURRICULUM].flatMap((domain) =>
              domain.lessons.map((lesson) => (
                <button
                  key={lesson.id}
                  onClick={() => {
                    setSelectedLessonId(lesson.id);
                    setSeed((s) => s + 1);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors",
                    selectedLessonId === lesson.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  <span className="text-lg">{lesson.emoji}</span>
                  <span className="flex-1">
                    <span className="font-semibold">{lesson.title}</span>
                    <span className={cn("ml-1 text-xs", selectedLessonId === lesson.id ? "text-primary-foreground/80" : "text-muted-foreground")}>
                      · {domain.title}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </Card>

        {found && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button onClick={() => window.print()} className="gap-2">
              <Printer className="h-4 w-4" /> Print worksheet
            </Button>
            <Button variant="outline" onClick={() => setSeed((s) => s + 1)} className="gap-2">
              <RefreshCw className="h-4 w-4" /> New questions
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowAnswers((v) => !v)}
              className="gap-2"
            >
              {showAnswers ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showAnswers ? "Hide answers" : "Show answers"}
            </Button>
          </div>
        )}
      </div>

      {/* Printable sheet */}
      {found && (
        <motion.div
          key={seed}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 rounded-2xl border-2 border-border bg-white p-6 text-black print:mt-0 print:border-0 print:p-0"
          id="worksheet"
        >
          <div className="mb-4 flex items-end justify-between border-b-2 border-black pb-2">
            <div>
              <h2 className="font-display text-xl font-bold">
                {found.lesson.emoji} {found.lesson.title}
              </h2>
              <p className="text-sm text-gray-600">{found.lesson.subtitle}</p>
            </div>
            <div className="text-right text-xs text-gray-600">
              <p>Name: ____________________</p>
              <p>Date: ____________</p>
            </div>
          </div>

          <ol className="space-y-4">
            {problems.map((p, i) => (
              <li key={p.id} className="flex gap-3">
                <span className="font-display font-bold">{i + 1}.</span>
                <div className="flex-1">
                  {p.story && <p className="text-sm italic text-gray-700">{p.story}</p>}
                  <p className="font-medium">{p.prompt}</p>
                  {p.answerType === "multiple-choice" && (
                    <div className="mt-1 flex flex-wrap gap-3 text-sm">
                      {p.choices.map((c, ci) => (
                        <span key={ci} className="inline-flex items-center gap-1">
                          <span className="inline-block h-3 w-3 rounded-full border border-black" />
                          <span className={cn(showAnswers && ci === p.correctIndex && "font-bold underline")}>{c}</span>
                        </span>
                      ))}
                    </div>
                  )}
                  {p.answerType !== "multiple-choice" && (
                    <div className="mt-1 flex items-center gap-2">
                      <span className="inline-block h-5 w-32 border-b-2 border-dotted border-gray-500" />
                      {showAnswers && (
                        <span className="rounded bg-amber-200 px-2 py-0.5 text-xs font-bold">
                          Answer: {formatAnswer(p)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>

          {showAnswers && (
            <div className="mt-6 break-before-page border-t-2 border-black pt-3">
              <h3 className="font-display text-lg font-bold">Answer Key</h3>
              <ol className="mt-1 grid grid-cols-2 gap-1 text-sm">
                {problems.map((p, i) => (
                  <li key={p.id}>
                    <span className="font-semibold">{i + 1}.</span> {formatAnswer(p)}
                  </li>
                ))}
              </ol>
            </div>
          )}

          <p className="mt-6 text-center text-xs text-gray-400">Math Stars · {found.lesson.title}</p>
        </motion.div>
      )}

      {!found && (
        <Card className="mt-6 flex items-center gap-3 p-6 text-sm text-muted-foreground">
          <FileText className="h-8 w-8 shrink-0 text-sky-500" />
          <span>Pick a lesson above to generate a worksheet. You can print it or save as PDF from the print dialog.</span>
        </Card>
      )}
    </div>
  );
}

function formatAnswer(problem: Problem): string {
  switch (problem.answerType) {
    case "number":
      return `${problem.answer}${problem.unit ? ` ${problem.unit}` : ""}`;
    case "multiple-choice":
      return problem.choices[problem.correctIndex];
    case "true-false":
      return problem.isTrue ? "True" : "False";
    case "fraction":
      return `${problem.numerator}/${problem.denominator}`;
    case "time":
      return `${problem.hour}:${String(problem.minute).padStart(2, "0")}`;
    case "numberline":
      return `${problem.numerator}/${problem.denominator}`;
    default:
      return "";
  }
}
