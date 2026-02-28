import { Question, AnswerRecord } from "@/types/exam";

const clean = (s: string) => s.replace(/^\*/, "");

export const checkAnswer = (question: Question, response: string | string[] | undefined): boolean => {
  if (!response) return false;

  const opts = [question.answer_1, question.answer_2, question.answer_3, question.answer_4].filter(Boolean);
  const correct = opts.filter((a) => a.startsWith("*")).map((a) => a.slice(1));

  switch (question.question_type) {
    case "TF":
    case "MC":
      return correct.some((c) => c === (response as string));

    case "MR": {
      const sel = response as string[];
      return sel.length === correct.length && correct.every((c) => sel.includes(c));
    }

    case "TI":
      return correct.some((c) => c.toLowerCase().trim() === (response as string).toLowerCase().trim());

    case "MG": {
      const pairs = response as string[];
      const correctPairs = opts.map((o) => o);
      return correctPairs.length === pairs.length && correctPairs.every((p) => pairs.includes(p));
    }

    case "SEQ": {
      const order = response as string[];
      return opts.every((o, i) => o === order[i]);
    }

    case "NUMG":
      return correct.some((c) => c.trim() === (response as string).trim());

    default:
      return false;
  }
};

export const buildScoreRecord = (
  studentId: string,
  questions: Question[],
  answers: Record<string, string | string[]>,
  duration: string
): { record: import("@/types/exam").ScoreRecord; totalPoints: number; maxPoints: number } => {
  let totalPoints = 0;
  let maxPoints = 0;

  const answerRecords: AnswerRecord[] = questions.map((q) => {
    const resp = answers[q.question_id];
    const isCorrect = checkAnswer(q, resp);
    const pts = parseInt(q.points) || 0;
    maxPoints += pts;
    if (isCorrect) totalPoints += pts;

    return {
      question_id: q.question_id,
      response: resp || "",
      correct: isCorrect,
      points: q.points,
    };
  });

  const percentage = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0;

  return {
    record: {
      student_id: studentId,
      answers: answerRecords,
      total_score: String(maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0),
      duration,
      status: percentage >= 75 ? "Memenuhi KKTP" : "Belum Memenuhi KKTP",
    },
    totalPoints,
    maxPoints,
  };
};
