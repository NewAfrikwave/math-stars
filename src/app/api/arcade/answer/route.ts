import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getStudentForRequest } from "@/lib/student";
import { ARCADE_GAMES, arcadeReward, parseArcadeAnswers, parseArcadeQuestions, publicQuestion } from "@/lib/arcade";
import { getCurrentRewardMission } from "@/lib/reward-server";
import { clientKey, rateLimit } from "@/lib/rate-limit";

type ReconciledRun = {
  attemptId: string;
  gameKey: string;
  nextIndex: number;
  correctCount: number;
  total: number;
  status: string;
  coinsEarned: number;
  dailyBonus: number;
};

function completedPayload(run: { attemptId: string; gameKey: string; nextIndex: number; correctCount: number; total: number; coinsEarned: number; dailyBonus: number }) {
  return {
    attemptId: run.attemptId,
    gameKey: run.gameKey,
    status: "completed" as const,
    nextIndex: run.nextIndex,
    correctCount: run.correctCount,
    total: run.total,
    score: Math.round((run.correctCount / Math.max(1, run.total)) * 100),
    coinsEarned: run.coinsEarned,
    dailyBonus: run.dailyBonus,
  };
}

function reconciledPayload(run: ReconciledRun, questions: NonNullable<ReturnType<typeof parseArcadeQuestions>>) {
  if (run.status === "completed") return completedPayload(run);
  return {
    attemptId: run.attemptId,
    gameKey: run.gameKey,
    status: "active" as const,
    nextIndex: run.nextIndex,
    correctCount: run.correctCount,
    total: run.total,
    question: run.nextIndex < questions.length ? publicQuestion(questions[run.nextIndex]) : null,
  };
}

export async function POST(req: Request) {
  const limit = rateLimit(clientKey(req, "arcade-answer"), 240, 15 * 60 * 1000);
  if (!limit.allowed) return NextResponse.json({ error: "Too many answers" }, { status: 429 });
  const body = await req.json().catch(() => null) as { attemptId?: unknown; questionIndex?: unknown; choiceIndex?: unknown } | null;
  if (!body || typeof body.attemptId !== "string" || !Number.isInteger(body.questionIndex) || !Number.isInteger(body.choiceIndex)) {
    return NextResponse.json({ error: "A valid answer is required" }, { status: 400 });
  }
  const questionIndex = Number(body.questionIndex);
  const choiceIndex = Number(body.choiceIndex);
  const student = await getStudentForRequest(req);
  const current = await db.arcadeRun.findFirst({ where: { attemptId: body.attemptId, studentId: student.id } });
  if (!current) return NextResponse.json({ error: "Arcade round not found" }, { status: 404 });
  if (current.status === "completed") {
    return NextResponse.json({ run: completedPayload(current), coins: student.arcadeCoins, reward: await getCurrentRewardMission(student.id), duplicate: true });
  }
  const questions = parseArcadeQuestions(current.questionsJson);
  if (!questions || questionIndex < 0 || questionIndex >= questions.length) return NextResponse.json({ error: "Round questions are invalid" }, { status: 409 });
  if (questionIndex < current.nextIndex) {
    return NextResponse.json({
      run: reconciledPayload(current, questions),
      coins: student.arcadeCoins,
      duplicate: true,
    });
  }
  if (questionIndex !== current.nextIndex) return NextResponse.json({ error: "Answer the current question first" }, { status: 409 });
  const question = questions[questionIndex];
  if (choiceIndex < 0 || choiceIndex >= question.choices.length) return NextResponse.json({ error: "Choose one answer" }, { status: 400 });

  const correct = choiceIndex === question.answerIndex;
  const nextIndex = questionIndex + 1;
  const correctCount = current.correctCount + (correct ? 1 : 0);
  const answers = [...parseArcadeAnswers(current.answersJson), { index: questionIndex, choiceIndex, correct }];

  if (nextIndex < current.total) {
    const updated = await db.arcadeRun.updateMany({
      where: { id: current.id, studentId: student.id, status: "active", nextIndex: questionIndex },
      data: { nextIndex, correctCount, answersJson: JSON.stringify(answers) },
    });
    if (updated.count !== 1) {
      const [latestRun, latestStudent] = await Promise.all([
        db.arcadeRun.findUniqueOrThrow({ where: { id: current.id } }),
        db.student.findUniqueOrThrow({ where: { id: student.id } }),
      ]);
      return NextResponse.json({
        run: reconciledPayload(latestRun, questions),
        coins: latestStudent.arcadeCoins,
        ...(latestRun.status === "completed" ? { reward: await getCurrentRewardMission(student.id) } : {}),
        duplicate: true,
      });
    }
    return NextResponse.json({
      correct,
      explanation: correct ? "Great move! Your place is saved." : `Good try. The answer was ${question.choices[question.answerIndex]}.`,
      run: { attemptId: current.attemptId, gameKey: current.gameKey, status: "active", nextIndex, correctCount, total: current.total, question: publicQuestion(questions[nextIndex]) },
    });
  }

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const game = ARCADE_GAMES.find((item) => item.key === current.gameKey);
  const result = await db.$transaction(async (tx) => {
    const freshStudent = await tx.student.findUniqueOrThrow({ where: { id: student.id } });
    const reward = arcadeReward(correctCount, current.total, freshStudent.arcadeLastBonusDate !== today);
    const won = await tx.arcadeRun.updateMany({
      where: { id: current.id, studentId: student.id, status: "active", nextIndex: questionIndex },
      data: {
        nextIndex,
        correctCount,
        answersJson: JSON.stringify(answers),
        status: "completed",
        activeKey: null,
        coinsEarned: reward.totalCoins,
        dailyBonus: reward.dailyBonus,
        completedAt: now,
      },
    });
    if (won.count !== 1) return null;
    const updatedStudent = await tx.student.update({
      where: { id: student.id },
      data: {
        arcadeCoins: { increment: reward.totalCoins },
        ...(reward.dailyBonus > 0 ? { arcadeLastBonusDate: today } : {}),
        lastPlayedAt: now,
      },
    });
    await tx.activityEvent.create({
      data: {
        studentId: student.id,
        type: "arcade",
        lessonId: current.gameKey,
        attemptId: current.attemptId,
        title: game?.title ?? "Math Adventure Arcade",
        emoji: game?.emoji ?? "🎮",
        score: reward.score,
        correct: correctCount,
        total: current.total,
        coins: reward.totalCoins,
      },
    });
    return { reward, coins: updatedStudent.arcadeCoins };
  });

  if (!result) {
    const completed = await db.arcadeRun.findUniqueOrThrow({ where: { id: current.id } });
    const latestStudent = await db.student.findUniqueOrThrow({ where: { id: student.id } });
    return NextResponse.json({ run: completedPayload(completed), coins: latestStudent.arcadeCoins, reward: await getCurrentRewardMission(student.id), duplicate: true });
  }

  const completed = { ...current, nextIndex, correctCount, coinsEarned: result.reward.totalCoins, dailyBonus: result.reward.dailyBonus };
  return NextResponse.json({
    correct,
    explanation: correct ? "Perfect finish! Your coins are safely saved." : `Round complete. The answer was ${question.choices[question.answerIndex]}.`,
    run: completedPayload(completed),
    coins: result.coins,
    reward: await getCurrentRewardMission(student.id),
  });
}
